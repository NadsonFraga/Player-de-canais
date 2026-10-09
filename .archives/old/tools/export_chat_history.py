import json
import os
import sys

def main():
    default_conv_id = "0746a65b-b4b5-4090-a934-5a5449e9197c"
    conv_id = sys.argv[1] if len(sys.argv) > 1 else default_conv_id

    user_home = os.path.expanduser("~")
    base_brain = os.path.join(user_home, ".gemini", "antigravity-ide", "brain", conv_id, ".system_generated", "logs")
    transcript_path = os.path.join(base_brain, "transcript_full.jsonl")
    if not os.path.exists(transcript_path):
        transcript_path = os.path.join(base_brain, "transcript.jsonl")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output_dir = os.path.join(project_root, ".archives", "history")
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
        f"> **Conversation ID**: `{conv_id}`",
        "> **Export Date**: 2026-10-06",
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
            except Exception:
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
                    tool_names = [tc.get("toolAction") or tc.get("toolSummary") or tc.get("name", "tool") for tc in tool_calls]
                    if tool_names:
                        md_lines.append(f"*Action ({step_index}): {', '.join(filter(None, tool_names))}*")
                        md_lines.append("")

    with open(md_output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    print(f"Exported readable Markdown ({message_count} messages) to {md_output_path}")

if __name__ == "__main__":
    main()
