curl -X POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
-H "Authorization: Bearer $DASHSCOPE_API_KEY" \
-H "Content-Type: application/json" \
-d '{
    "model": "qwen-plus",
    "messages":[      
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "你好"
        },
        {
            "role": "assistant",
            "content": "你好啊，我是通义千问。"
        },
        {
            "role": "user",
            "content": "你有哪些技能？"
        }
    ]
}'