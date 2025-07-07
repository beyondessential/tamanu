do
  local proto          = Proto("tamanu.stream", "Tamanu stream")
  local F_msg          = ProtoField.none("tamanu.message", "Message", base.HEX)
  local F_msg_length   = ProtoField.uint32("tamanu.length", "Payload length", base.DEC)
  local F_msg_kind     = ProtoField.uint32("tamanu.kind", "Message kind", base.HEX)
  local F_msg_data     = ProtoField.string("tamanu.data", "Message data", base.NONE)
  proto.fields         = { F_msg, F_msg_length, F_msg_kind, F_msg_data }

  local f_tcp_stream   = Field.new("tcp.stream")
  local f_content_type = Field.new("http.content_type")
  local f_http_data    = Field.new("http.file_data")

  local function decode_kind(id)
    if id == 0xf0000001 then return "END" end
    if id == 0x00000001 then return "SESSION WAITING" end
    if id == 0x00000002 then return "PULL WAITING" end
    if id == 0x00000003 then return "PULL CHANGE" end
    return nil
  end

  function proto.dissector(tvbuffer, pinfo, treeitem)
    if not f_tcp_stream() then return end
    if not f_http_data() then return end
    if not f_content_type() then return end
    if f_content_type().value ~= "application/json+frame" then return end

    local data = f_http_data().range
    local subtree = treeitem:add(proto, data)

    local offset = 0
    while offset < data:len() do
      local kind = data(offset, 4)
      local len = data(offset + 4, 4)
      local msg_data = data(offset + 8, len:uint())
      local msg = subtree:add(F_msg, data(offset, len:uint() + 8))
      msg:append_text(": " .. decode_kind(kind:uint()))
      msg:add(F_msg_kind, kind, kind:uint())
      msg:add(F_msg_length, len, len:uint())
      if len:uint() > 0 then msg:add(F_msg_data, msg_data) end
      offset = offset + 8 + len:uint()
    end
  end

  register_postdissector(proto)
end
