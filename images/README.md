# Images

## Purpose
This folder stores diagrams, screenshots, and visual evidence used throughout weekly work, projects, and the final presentation.

## What to Store Here
- Architecture and data flow diagrams
- Threat model diagrams and attack trees
- Screenshots from tools and test results
- Whiteboard visuals and exported drawings

## Recommended Naming
Use consistent, descriptive names:
- week2-pen-test-topology.png
- week4-stride-threat-model.png
- week6-zap-scan-results.png
- final-presentation-architecture.png

## Usage in Markdown
Reference images from markdown files with relative paths.

Examples:
- From root README: `![Threat Model](images/week4-stride-threat-model.png)`
- From a week folder README: `![Threat Model](../images/week4-stride-threat-model.png)`

## Quality Guidelines
- Prefer PNG for diagrams and screenshots.
- Use clear labels in diagrams.
- Keep image dimensions readable in GitHub preview.
- Include short alt text for accessibility.

## Suggested Index
Add a short index below as you add assets:

| File | Used In | Description |
|---|---|---|
| week2-lab-architecture.excalidraw | weekly-projects/project-1-labsetup.md | Editable Excalidraw source for the Project 1 VM topology diagram. |
| week2-lab-architecture.png | weekly-projects/project-1-labsetup.md | Exported VM topology showing Kali attacker, Metasploitable target, and shared virtual network. |
