import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { CircularProgress, IconButton, Paper, TextField, Typography } from '@material-ui/core';
import { Close, Send } from '@material-ui/icons';
import Markdown from 'react-markdown';
import { Colors } from '../../constants';
import { useApi } from '../../api';

const PanelContainer = styled(Paper)`
  position: fixed;
  bottom: 0;
  left: 280px;
  width: 380px;
  height: 500px;
  display: flex;
  flex-direction: column;
  background: ${Colors.primaryDark};
  color: ${Colors.white};
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.4);
  border-radius: 8px 8px 0 0;
  z-index: 1300;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
`;

const HeaderTitle = styled(Typography)`
  color: ${Colors.white};
  font-weight: 600;
  font-size: 15px;
`;

const CloseButton = styled(IconButton)`
  padding: 4px;
  color: ${Colors.white};
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageBubble = styled.div`
  max-width: 90%;
  padding: 8px 12px;
  border-radius: ${props => (props.$role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px')};
  background: ${props =>
    props.$role === 'user' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'};
  align-self: ${props => (props.$role === 'user' ? 'flex-end' : 'flex-start')};
  color: ${Colors.white};
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;

  p { margin: 0 0 6px 0; }
  p:last-child { margin-bottom: 0; }
  ul, ol { margin: 4px 0; padding-left: 18px; }
  li { margin: 2px 0; }
  code { background: rgba(255,255,255,0.15); border-radius: 3px; padding: 1px 4px; font-size: 12px; }
  pre { background: rgba(0,0,0,0.3); border-radius: 4px; padding: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  strong { font-weight: 600; }
`;

const CannotAnswerBubble = styled(MessageBubble)`
  background: rgba(255, 200, 100, 0.15);
  border: 1px solid rgba(255, 200, 100, 0.3);
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
`;

const SourcesBox = styled.div`
  margin-top: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  align-self: flex-start;
`;

const SourceItem = styled.div`
  font-family: monospace;
  font-size: 11px;
`;

const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  align-self: flex-start;
  padding: 4px 0;
`;

const InputArea = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
`;

const StyledTextField = styled(TextField)`
  flex: 1;
  & .MuiInputBase-root {
    color: ${Colors.white};
    background: rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    font-size: 13px;
    padding: 8px 12px;
  }
  & .MuiInputBase-root:hover {
    background: rgba(255, 255, 255, 0.12);
  }
  & .MuiOutlinedInput-notchedOutline {
    border-color: rgba(255, 255, 255, 0.2);
  }
  & .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
    border-color: rgba(255, 255, 255, 0.4);
  }
  & .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: rgba(255, 255, 255, 0.6);
  }
  & .MuiInputBase-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
    opacity: 1;
  }
`;

const SendButton = styled(IconButton)`
  padding: 8px;
  color: ${Colors.white};
  background: rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  &:disabled {
    color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.05);
  }
`;

export const AskAiPanel = ({ open, onClose }) => {
  const api = useApi();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Reset state when panel closes
  const handleClose = useCallback(() => {
    setMessages([]);
    setInput('');
    setConversationId(null);
    setIsLoading(false);
    onClose();
  }, [onClose]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setIsLoading(true);

    try {
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const conv = await api.post('ask-ai/conversations', { title: trimmed.slice(0, 60) });
        activeConversationId = conv.id;
        setConversationId(activeConversationId);
      }

      const response = await api.post(`ask-ai/conversations/${activeConversationId}/messages`, {
        content: trimmed,
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.cannotAnswer ? null : response.answer,
          sources: response.sources ?? [],
          cannotAnswer: response.cannotAnswer,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'error', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [api, conversationId, input, isLoading]);

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  if (!open) return null;

  return (
    <PanelContainer elevation={8}>
      <Header>
        <HeaderTitle variant="body1">Ask AI</HeaderTitle>
        <CloseButton onClick={handleClose} size="small">
          <Close fontSize="small" />
        </CloseButton>
      </Header>

      <MessageList ref={scrollRef}>
        {messages.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            Ask a question about how Tamanu works.
          </div>
        )}

        {messages.map((msg, index) => {
          if (msg.cannotAnswer) {
            return (
              <CannotAnswerBubble key={index} $role="assistant">
                I don&apos;t have enough information to answer that question.
              </CannotAnswerBubble>
            );
          }

          return (
            <React.Fragment key={index}>
              <MessageBubble $role={msg.role}>
                <Markdown>{msg.content}</Markdown>
              </MessageBubble>
              {msg.role === 'assistant' && msg.sources?.length > 0 && (
                <SourcesBox>
                  Sources:
                  {msg.sources.map((source, i) => (
                    <SourceItem key={i}>{source.filePath}</SourceItem>
                  ))}
                </SourcesBox>
              )}
            </React.Fragment>
          );
        })}

        {isLoading && (
          <LoadingRow>
            <CircularProgress size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
            Thinking…
          </LoadingRow>
        )}
      </MessageList>

      <InputArea>
        <StyledTextField
          variant="outlined"
          multiline
          maxRows={4}
          placeholder="Ask a question…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          inputProps={{ 'data-testid': 'askai-input' }}
        />
        <SendButton onClick={handleSend} disabled={isLoading || !input.trim()} size="small">
          {isLoading ? (
            <CircularProgress size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
          ) : (
            <Send fontSize="small" />
          )}
        </SendButton>
      </InputArea>
    </PanelContainer>
  );
};
