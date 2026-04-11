import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { CircularProgress, IconButton, TextField, Typography } from '@material-ui/core';
import Close from '@mui/icons-material/Close';
import Remove from '@mui/icons-material/Remove';
import Send from '@mui/icons-material/Send';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import Markdown from 'react-markdown';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { TranslatedText } from '../Translation/TranslatedText';
import { useTranslation } from '../../contexts/Translation';

const OuterContainer = styled.div`
  position: fixed;
  bottom: 80px;
  right: 24px;
  z-index: 1300;
  display: flex;
  flex-direction: column;
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15));
  border: 1px solid ${Colors.softOutline};
  border-radius: 8px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: ${Colors.white};
  border-radius: ${props => (props.$minimised ? '8px' : '8px 8px 0 0')};
  border-bottom: ${props => (props.$minimised ? 'none' : `1px solid ${Colors.softOutline}`)};
  flex-shrink: 0;
  cursor: grab;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
`;

const HeaderTitle = styled(Typography)`
  color: ${Colors.darkestText};
  font-weight: 600;
  font-size: 14px;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 2px;
`;

const HeaderButton = styled(IconButton)`
  padding: 4px;
  color: ${Colors.midText};
  &:hover {
    background-color: ${Colors.background};
  }
`;

const PanelBody = styled.div`
  display: flex;
  flex-direction: column;
  background: ${Colors.white};
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  height: 100%;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MessageBubble = styled.div`
  max-width: 88%;
  padding: 8px 12px;
  border-radius: ${props => (props.$role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px')};
  background: ${props => (props.$role === 'user' ? Colors.primary10 : Colors.background)};
  align-self: ${props => (props.$role === 'user' ? 'flex-end' : 'flex-start')};
  color: ${Colors.darkestText};
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  border: 1px solid ${props => (props.$role === 'user' ? Colors.softOutline : Colors.outline)};

  p { margin: 0 0 6px 0; }
  p:last-child { margin-bottom: 0; }
  ul, ol { margin: 4px 0; padding-left: 18px; }
  li { margin: 2px 0; }
  code { background: rgba(0,0,0,0.07); border-radius: 3px; padding: 1px 4px; font-size: 12px; }
  pre { background: rgba(0,0,0,0.06); border-radius: 4px; padding: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  strong { font-weight: 600; }
`;

const CannotAnswerBubble = styled(MessageBubble)`
  background: #fff8e6;
  border: 1px solid #f0d070;
  color: #7a5c00;
  font-style: italic;
`;

const SourcesBox = styled.div`
  margin-top: 4px;
  font-size: 11px;
  color: ${Colors.midText};
  align-self: flex-start;
`;

const DisclaimerNote = styled.div`
  font-size: 11px;
  color: ${Colors.softText};
  font-style: italic;
  align-self: flex-start;
  margin-top: 2px;
`;

const SourceItem = styled.div`
  font-family: monospace;
  font-size: 11px;
`;

const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${Colors.midText};
  font-size: 13px;
  align-self: flex-start;
  padding: 4px 0;
`;

const InputArea = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid ${Colors.outline};
  flex-shrink: 0;
  background: ${Colors.white};
`;

const StyledTextField = styled(TextField)`
  flex: 1;
  & .MuiInputBase-root {
    color: ${Colors.darkestText};
    background: ${Colors.background};
    border-radius: 6px;
    font-size: 13px;
    padding: 8px 12px;
  }
  & .MuiInputBase-root:hover {
    background: ${Colors.softOutline};
  }
  & .MuiOutlinedInput-notchedOutline {
    border-color: ${Colors.outline};
  }
  & .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
    border-color: ${Colors.softText};
  }
  & .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${Colors.primary};
  }
  & .MuiInputBase-input::placeholder {
    color: ${Colors.softText};
    opacity: 1;
  }
`;

const SendButton = styled(IconButton)`
  padding: 8px;
  color: ${Colors.white};
  background: ${Colors.primary};
  border-radius: 6px;
  &:hover {
    background: ${Colors.primaryDark};
  }
  &:disabled {
    color: ${Colors.softText};
    background: ${Colors.softOutline};
  }
`;

export const AskAiPanel = ({ open, onClose }) => {
  const api = useApi();
  const { getTranslation } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [size, setSize] = useState({ width: 380, height: 500 });
  const scrollRef = useRef(null);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleClose = useCallback(() => {
    setMessages([]);
    setInput('');
    setConversationId(null);
    setIsLoading(false);
    setMinimised(false);
    onClose();
  }, [onClose]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setMinimised(false);
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

      const isClarifying = Boolean(response.clarifyingQuestion);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: isClarifying ? response.clarifyingQuestion : response.answer,
          sources: response.sources ?? [],
          cannotAnswer: !isClarifying && response.cannotAnswer,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'error',
          content: getTranslation('askAi.chat.error', 'Something went wrong. Please try again.'),
        },
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
    <Draggable handle=".chat-drag-handle" nodeRef={nodeRef} bounds="parent">
      <OuterContainer ref={nodeRef}>
        <Header className="chat-drag-handle" $minimised={minimised}>
          <HeaderTitle variant="body1">
            <TranslatedText stringId="askAi.chat.title" fallback="Chat" />
          </HeaderTitle>
          <HeaderButtons>
            <HeaderButton
              onClick={() => setMinimised(m => !m)}
              size="small"
              title={minimised ? 'Restore' : 'Minimise'}
            >
              <Remove fontSize="small" />
            </HeaderButton>
            <HeaderButton onClick={handleClose} size="small" title="Close">
              <Close fontSize="small" />
            </HeaderButton>
          </HeaderButtons>
        </Header>

        {!minimised && (
          <Resizable
            size={size}
            onResizeStop={(e, direction, ref, delta) => {
              setSize(prev => ({
                width: prev.width + delta.width,
                height: prev.height + delta.height,
              }));
            }}
            minWidth={280}
            minHeight={200}
            maxWidth={700}
            maxHeight={800}
            enable={{
              top: true,
              left: true,
              topLeft: true,
              topRight: true,
              bottomLeft: true,
              bottom: false,
              right: false,
              bottomRight: false,
            }}
          >
            <PanelBody>
              <MessageList ref={scrollRef}>
                {messages.length === 0 && (
                  <div
                    style={{
                      color: Colors.midText,
                      fontSize: 13,
                      textAlign: 'center',
                      marginTop: 40,
                    }}
                  >
                    <TranslatedText
                      stringId="askAi.chat.emptyState"
                      fallback="Ask a question about how Tamanu works."
                    />
                  </div>
                )}

                {messages.map((msg, index) => {
                  if (msg.cannotAnswer) {
                    return (
                      <React.Fragment key={index}>
                        <CannotAnswerBubble $role="assistant">
                          <TranslatedText
                            stringId="askAi.chat.cannotAnswer"
                            fallback="I don't have enough information to answer that question. For direct support, visit "
                          />{' '}
                          <a
                            href="https://bes-support.zendesk.com/hc/en-us/"
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'inherit' }}
                          >
                            bes-support.zendesk.com
                          </a>
                          .
                        </CannotAnswerBubble>
                      </React.Fragment>
                    );
                  }

                  return (
                    <React.Fragment key={index}>
                      <MessageBubble $role={msg.role}>
                        <Markdown>{msg.content}</Markdown>
                      </MessageBubble>
                      {msg.role === 'assistant' && msg.sources?.length > 0 && (
                        <SourcesBox>
                          <TranslatedText stringId="askAi.chat.sources" fallback="Sources:" />
                          {msg.sources.map((source, i) => (
                            <SourceItem key={i}>{source.filePath}</SourceItem>
                          ))}
                        </SourcesBox>
                      )}
                      {msg.role === 'assistant' && (
                        <DisclaimerNote>
                          <TranslatedText
                            stringId="askAi.chat.disclaimer"
                            fallback="Note: This answer may need verification"
                          />
                        </DisclaimerNote>
                      )}
                    </React.Fragment>
                  );
                })}

                {isLoading && (
                  <LoadingRow>
                    <CircularProgress size={14} style={{ color: Colors.midText }} />
                    <TranslatedText stringId="askAi.chat.thinking" fallback="Thinking…" />
                  </LoadingRow>
                )}
              </MessageList>

              <InputArea>
                <StyledTextField
                  variant="outlined"
                  multiline
                  maxRows={4}
                  placeholder={getTranslation('askAi.chat.inputPlaceholder', 'Ask a question…')}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  inputProps={{ 'data-testid': 'askai-input' }}
                />
                <SendButton
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  size="small"
                >
                  {isLoading ? (
                    <CircularProgress size={16} style={{ color: Colors.softText }} />
                  ) : (
                    <Send fontSize="small" />
                  )}
                </SendButton>
              </InputArea>
            </PanelBody>
          </Resizable>
        )}
      </OuterContainer>
    </Draggable>
  );
};
