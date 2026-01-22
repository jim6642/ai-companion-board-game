curl -X POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
-H "Authorization: Bearer $DASHSCOPE_API_KEY" \
-H "Content-Type: application/json" \
-d '{
    "model": "qwen-plus",
    "messages": [
        {
            "role": "system",
            "content": "请抽取用户的姓名与年龄信息，以JSON格式返回"
        },
        {
            "role": "user", 
            "content": "大家好，我叫刘五，今年34岁，邮箱是liuwu@example.com"
        }
    ],
    "response_format": {
        "type": "json_object"
    }
}'