import json
import os
import sys

def main():
    transcript_path = r"C:\Users\ratew\.gemini\antigravity-ide\brain\bdf3e244-9820-4c3b-b692-f58edde26c4e\.system_generated\logs\transcript_full.jsonl"
    output_dir = r"c:\Users\ratew\OneDrive\Área de Trabalho\PESSOAL\CODE\ANTIGRAVITY\PROJETO1 - TV\docs"
    os.makedirs(output_dir, exist_ok=True)
    
    md_output_path = os.path.join(output_dir, "CHAT_HISTORY.md")
    jsonl_output_path = os.path.join(output_dir, "chat_history_full.jsonl")
    
    if not os.path.exists(transcript_path):
        print(f"Error: Transcript not found at {transcript_path}")
        return

    print(f"Reading transcript: {transcript_path} ({os.path.getsize(transcript_path)} bytes)")
    
    # 1. Copy raw full transcript
    with open(transcript_path, "r", encoding="utf-8") as src, open(jsonl_output_path, "w", encoding="utf-8") as dst:
        for line in src:
            dst.write(line)
    print(f"Exported raw JSONL to {jsonl_output_path}")

    # 2. Parse and generate clean readable Markdown
    md_lines = [
        "# Complete Chat History / Transcript",
        "",
        "> **Project**: Tvzinha Web App",
        f"> **Conversation ID**: `bdf3e244-9820-4c3b-b692-f58edde26c4e`",
        "> **Export Date**: 2026-10-05",
        "",
        "---",
        ""
    ]

    message_count = 0
    with open(transcript_path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f):
            if not line.strip():
                continue
            try:
                entry = json.loads(line)
            except Exception as e:
                continue

            entry_type = entry.get("type", "")
            source = entry.get("source", "")
            content = entry.get("content", "")
            tool_calls = entry.get("tool_calls", [])
            step_index = entry.get("step_index", line_num)

            # Check if User Input
            if entry_type == "USER_INPUT" or source == "USER_EXPLICIT":
                message_count += 1
                md_lines.append(f"## 👤 User (Step #{step_index})")
                md_lines.append("")
                if content:
                    md_lines.append(content.strip())
                md_lines.append("")
                md_lines.append("---")
                md_lines.append("")
            
            # Check if Model / Assistant Response
            elif entry_type == "PLANNER_RESPONSE" or source == "MODEL":
                if content and content.strip():
                    message_count += 1
                    md_lines.append(f"## 🤖 Assistant (Step #{step_index})")
                    md_lines.append("")
                    md_lines.append(content.strip())
                    md_lines.append("")
                    md_lines.append("---")
                    md_lines.append("")
                elif tool_calls:
                    # Summarize tool calls cleanly if there's no direct message
                    tool_names = [tc.get("toolAction") or tc.get("toolSummary") or tc.get("name", "tool") for tc in tool_calls]
                    if tool_names:
                        md_lines.append(f"*Action ({step_index}): {', '.join(filter(None, tool_names))}*")
                        md_lines.append("")

    with open(md_output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    print(f"Exported readable Markdown ({message_count} messages) to {md_output_path}")

if __name__ == "__main__":
    main()
