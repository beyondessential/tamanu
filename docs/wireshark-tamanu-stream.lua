-- Wireshark dissector for Tamanu Streaming Protocol
--
-- install by symlinking into your ~/.local/lib/wireshark/plugins/
-- or wherever your install reads from, see Wireshark documentation:
-- https://www.wireshark.org/docs/wsug_html_chunked/ChPluginFolders.html
do
  -- define fields that can be filtered on and how they're displayed in the UI
  local proto          = Proto("tamanu.stream", "Tamanu stream")
  local F_msg          = ProtoField.none("tamanu.message", "Message", base.HEX)
  local F_msg_length   = ProtoField.uint32("tamanu.length", "Payload length", base.DEC)
  local F_msg_kind     = ProtoField.uint16("tamanu.kind", "Message kind", base.HEX)
  local F_msg_data     = ProtoField.string("tamanu.data", "Message data", base.NONE)
  proto.fields         = { F_msg, F_msg_length, F_msg_kind, F_msg_data }

  -- existing fields that we want to match on and use for dissecting
  local f_tcp_stream   = Field.new("tcp.stream")
  local f_content_type = Field.new("http.content_type")
  local f_http_data    = Field.new("http.file_data")

  -- these match the message kinds defined in
  -- /packages/constants/src/sync.ts
  local function decode_kind(id)
    if id == 0xf001 then return "END" end
    if id == 0x0001 then return "SESSION WAITING" end
    if id == 0x0002 then return "PULL WAITING" end
    if id == 0x0003 then return "PULL CHANGE" end
    return nil
  end

  function proto.dissector(tvbuffer, pinfo, treeitem)
    -- if we're not looking at an HTTP response with the right content type, go away
    if not f_tcp_stream() then return end
    if not f_http_data() then return end
    if not f_content_type() then return end
    if f_content_type().value ~= "application/json+frame" then return end

    -- the actual data in the HTTP response stream
    local data = f_http_data().range

    -- declare a new tree in the packet UI for the protocol
    local subtree = treeitem:add(proto, data)

    -- loop through messages in the stream
    local offset = 0
    local amount = 0
    while offset < data:len() do
      -- skip the CR+LF bytes, then read the u16 kind and u32 length
      local kind = data(offset + 2, 2)
      local len = data(offset + 4, 4)

      -- read the message payload
      local msg_len = len:uint()

      -- declare a new subtree for the individual message
      -- with a label that has the decoded kind, and then
      -- add the decoded field values. message payload is
      -- omitted if length is zero, for concise display
      local msg = subtree:add(F_msg, data(offset, msg_len + 8))
      local decoded_kind = decode_kind(kind:uint())
      if decoded_kind then msg:append_text(": " .. decoded_kind) end
      msg:add(F_msg_kind, kind, kind:uint())
      msg:add(F_msg_length, len, msg_len)
      if msg_len > 0 then msg:add(F_msg_data, data(offset + 8, len:uint())) end

      -- increment to parse the next message
      offset = offset + 8 + msg_len
      amount = amount + 1
    end

    -- once we're done, add the total number of messages at the top
    if amount > 0 then
      subtree:append_text(" (" .. amount .. " messages)")
    end
  end

  register_postdissector(proto)
end
