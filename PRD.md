# Markdown Editor PRD

## 1. 문서 개요

### 1.1 제품명
**Markdown Editor**

### 1.2 제품 정의
Markdown 문법을 사용하여 문서를 작성하고, 실시간 미리보기를 통해 결과를 확인할 수 있는 웹 기반 문서 편집기이다.

사용자는 별도의 설치 없이 브라우저에서 Markdown 문서를 작성하고 수정할 수 있으며, 작성한 문서를 `.md` 파일로 저장하거나 내보낼 수 있다.

### 1.3 제품 목표
Markdown을 처음 사용하는 사용자부터 개발자까지 누구나 빠르고 편리하게 Markdown 문서를 작성할 수 있는 간결한 편집 환경을 제공한다.

핵심 목표는 다음과 같다.

- Markdown 작성 과정 단순화
- 실시간 Markdown 렌더링 제공
- 작성 중 데이터 손실 최소화
- 키보드 중심의 빠른 문서 작성 지원
- Markdown 파일 Import / Export 지원
- 다양한 화면 크기에서 일관된 작성 경험 제공

---

# 2. 배경 및 문제 정의

Markdown은 README, 기술 문서, 블로그, 개발 문서 등 다양한 분야에서 사용되고 있다.

그러나 Markdown에 익숙하지 않은 사용자는 다음과 같은 불편함을 경험한다.

- Markdown 문법을 직접 기억해야 한다.
- 작성 결과를 확인하기 위해 별도의 렌더링 과정이 필요하다.
- 일반 텍스트 편집기는 Markdown 작성 기능이 부족하다.
- 복잡한 Markdown 편집기는 기능이 지나치게 많아 사용하기 어렵다.
- 작성 중 페이지를 닫거나 새로고침하면 내용이 유실될 수 있다.

따라서 본 제품은 **Markdown 작성과 결과 확인을 하나의 화면에서 제공하는 간단하고 직관적인 편집기**를 목표로 한다.

---

# 3. 타깃 사용자

## 3.1 개발자

README, API 문서, 프로젝트 문서 등을 Markdown으로 작성하는 사용자.

### 주요 요구사항

- 빠른 키보드 입력
- 코드 블록 지원
- Markdown 파일 저장
- 문법 하이라이팅
- 단축키 지원

---

## 3.2 대학생 및 일반 사용자

Markdown 문법을 학습하거나 Markdown 기반 문서를 작성하려는 사용자.

### 주요 요구사항

- Markdown 문법을 몰라도 사용할 수 있는 UI
- 실시간 미리보기
- 기본 Markdown 서식 버튼
- 간단한 사용법 안내

---

## 3.3 기술 문서 작성자

개발 문서, 위키, 기술 블로그 등을 작성하는 사용자.

### 주요 요구사항

- 긴 문서 편집
- Heading 구조 확인
- 코드 블록
- 링크 및 이미지 삽입
- 문서 Export

---

# 4. 사용자 시나리오

## Scenario 1 — 기본 문서 작성

1. 사용자가 Markdown Editor에 접속한다.
2. 편집 영역에 Markdown 문서를 작성한다.
3. 입력 내용이 실시간으로 Preview 영역에 렌더링된다.
4. 사용자는 결과를 확인하며 문서를 수정한다.
5. 작성한 문서를 `.md` 파일로 다운로드한다.

---

## Scenario 2 — 기존 Markdown 파일 편집

1. 사용자가 기존 `.md` 파일을 불러온다.
2. Markdown Editor가 파일 내용을 Editor 영역에 표시한다.
3. 사용자가 내용을 수정한다.
4. Preview 영역에서 변경 결과를 확인한다.
5. 수정된 Markdown 파일을 다시 다운로드한다.

---

## Scenario 3 — Markdown 초보 사용자

1. 사용자가 문서를 작성한다.
2. 툴바의 **Heading** 버튼을 클릭한다.
3. 선택한 텍스트가 Markdown Heading 문법으로 변환된다.

예:

```markdown
# 제목
```

4. Preview 영역에서 결과를 확인한다.

---

# 5. 핵심 기능

## 5.1 Markdown Editor

Markdown 텍스트를 입력할 수 있는 편집 영역을 제공한다.

### 지원 Markdown

MVP에서는 다음 문법을 지원한다.

- Heading
- Paragraph
- Bold
- Italic
- Strikethrough
- Blockquote
- Ordered List
- Unordered List
- Task List
- Horizontal Rule
- Link
- Image
- Inline Code
- Code Block
- Table

예:

```markdown
# Heading

**Bold**

*Italic*

> Quote

- List
- List

```javascript
console.log("Hello World");
```
```

---

# 6. 실시간 Preview

Editor에서 작성한 Markdown을 HTML로 변환하여 Preview 영역에 표시한다.

기본 화면 구조는 다음과 같다.

```text
┌─────────────────────────────────────────────┐
│ Markdown Editor                             │
├─────────────────────┬───────────────────────┤
│                     │                       │
│       Editor        │        Preview        │
│                     │                       │
│                     │                       │
└─────────────────────┴───────────────────────┘
```

Markdown 입력 변경 시 Preview를 자동으로 갱신한다.

### 요구사항

- 입력 후 즉시 렌더링
- 긴 문서에서도 입력 지연 최소화
- Editor와 Preview 스크롤 동기화 지원

---

# 7. Toolbar

Markdown 문법을 쉽게 입력할 수 있도록 상단 툴바를 제공한다.

예시:

```text
H1  H2  B  I  S  Quote  Code  Link  Image  List  Table
```

### 기능

| 버튼 | 기능 |
|---|---|
| H1 | Heading 1 |
| H2 | Heading 2 |
| Bold | Bold |
| Italic | Italic |
| Strike | Strikethrough |
| Quote | Blockquote |
| Code | Inline Code / Code Block |
| Link | Link 삽입 |
| Image | Image 삽입 |
| List | 목록 생성 |
| Table | Markdown Table 생성 |

텍스트가 선택된 상태에서 버튼을 클릭한 경우 선택 영역에 Markdown 문법을 적용한다.

예:

```text
Hello
```

Bold 버튼 클릭:

```markdown
**Hello**
```

---

# 8. 문서 자동 저장

작성 중인 문서는 브라우저에 자동 저장한다.

### MVP

LocalStorage 사용.

저장 데이터:

- Markdown Content
- 문서 제목
- 마지막 수정 시간

저장 주기:

- 입력 변경 후 약 500ms Debounce
- 또는 주요 변경 시 자동 저장

페이지를 새로고침하거나 브라우저를 다시 열어도 마지막 작성 내용을 복원한다.

---

# 9. 파일 Import / Export

## Import

사용자는 `.md` 또는 `.markdown` 파일을 불러올 수 있다.

지원 방식:

- 파일 선택
- Drag & Drop

---

## Export

작성 중인 Markdown 문서를 `.md` 파일로 다운로드할 수 있다.

예:

```text
README.md
document.md
notes.md
```

향후 다음 포맷 지원을 고려한다.

- HTML
- PDF

---

# 10. Keyboard Shortcut

문서 작성 효율을 위해 단축키를 제공한다.

| 기능 | Windows | macOS |
|---|---|---|
| Bold | Ctrl + B | Cmd + B |
| Italic | Ctrl + I | Cmd + I |
| Save | Ctrl + S | Cmd + S |
| Undo | Ctrl + Z | Cmd + Z |
| Redo | Ctrl + Shift + Z | Cmd + Shift + Z |

추가 단축키는 향후 확장한다.

---

# 11. Editor View Mode

사용자는 편집 화면 구성을 변경할 수 있다.

### Split View

```text
Editor | Preview
```

기본 모드.

### Editor Only

```text
Editor
```

집중해서 글을 작성하는 모드.

### Preview Only

```text
Preview
```

최종 결과를 확인하는 모드.

---

# 12. Dark Mode

Light Mode와 Dark Mode를 지원한다.

### Light

```text
Background: White
Text: Dark
```

### Dark

```text
Background: Dark
Text: Light
```

사용자 설정은 LocalStorage에 저장한다.

기본 설정은 OS 테마를 따른다.

---

# 13. 문서 통계

현재 문서의 간단한 정보를 화면 하단에 표시한다.

예:

```text
Words 124 | Characters 762 | Lines 38
```

지원 항목:

- 글자 수
- 단어 수
- 줄 수

---

# 14. UX/UI 구조

## Desktop

```text
┌───────────────────────────────────────────────────────┐
│ Markdown Editor                  Import Export ⚙ Theme │
├───────────────────────────────────────────────────────┤
│ H1 H2 B I S Quote Code Link Image List Table          │
├───────────────────────────┬───────────────────────────┤
│                           │                           │
│                           │                           │
│          Editor           │          Preview          │
│                           │                           │
│                           │                           │
├───────────────────────────┴───────────────────────────┤
│ Words 124 | Characters 762 | Saved                   │
└───────────────────────────────────────────────────────┘
```

---

## Mobile

모바일에서는 Editor와 Preview를 동시에 보여주기 어렵기 때문에 Tab 방식으로 제공한다.

```text
┌─────────────────────────┐
│ Markdown Editor         │
├─────────────────────────┤
│ Editor | Preview        │
├─────────────────────────┤
│                         │
│                         │
│        Editor           │
│                         │
│                         │
└─────────────────────────┘
```

---

# 15. 기능 요구사항

## FR-01 Markdown 입력

사용자는 Editor 영역에서 Markdown 텍스트를 입력할 수 있어야 한다.

## FR-02 실시간 Preview

Markdown 입력 내용은 Preview 영역에 실시간으로 렌더링되어야 한다.

## FR-03 Markdown Toolbar

사용자는 Toolbar를 통해 Markdown 문법을 적용할 수 있어야 한다.

## FR-04 자동 저장

작성 중인 내용은 브라우저 LocalStorage에 자동 저장되어야 한다.

## FR-05 문서 복원

사용자가 페이지를 다시 열었을 경우 이전 작성 내용을 복원할 수 있어야 한다.

## FR-06 Markdown Import

사용자는 `.md` 파일을 불러올 수 있어야 한다.

## FR-07 Markdown Export

사용자는 작성한 문서를 `.md` 파일로 다운로드할 수 있어야 한다.

## FR-08 View Mode

사용자는 다음 View Mode를 선택할 수 있어야 한다.

- Split
- Editor Only
- Preview Only

## FR-09 Theme

Light Mode / Dark Mode를 지원해야 한다.

## FR-10 Shortcut

주요 Markdown 기능에 대해 키보드 단축키를 지원해야 한다.

---

# 16. 비기능 요구사항

## 성능

Markdown 입력 후 Preview 렌더링까지 체감 지연이 없어야 한다.

목표:

```text
Render latency < 100ms
```

일반적인 수천 줄 수준의 Markdown 문서를 안정적으로 처리해야 한다.

---

## 반응형 UI

다음 환경을 지원한다.

- Desktop
- Laptop
- Tablet
- Mobile

---

## 브라우저 지원

최신 버전 기준:

- Chrome
- Edge
- Safari
- Firefox

---

## 보안

Markdown을 HTML로 변환할 때 XSS 공격을 방지해야 한다.

예:

```html
<script>alert("XSS")</script>
```

위와 같은 코드가 실행되지 않도록 HTML Sanitizing을 적용한다.

---

# 17. 권장 기술 스택

## Frontend

```text
React
TypeScript
Vite
```

또는

```text
Next.js
TypeScript
```

### UI

```text
Tailwind CSS
```

### Editor

후보:

```text
CodeMirror 6
Monaco Editor
```

Markdown Editor 목적에는 CodeMirror가 상대적으로 가볍기 때문에 우선 고려한다.

### Markdown Parser

```text
markdown-it
```

또는

```text
remark
rehype
```

### Syntax Highlight

```text
Shiki
highlight.js
Prism
```

---

# 18. 데이터 구조

MVP에서는 서버 없이 LocalStorage 기반으로 동작한다.

예:

```json
{
  "document": {
    "id": "doc_001",
    "title": "README",
    "content": "# Hello World",
    "createdAt": "2026-09-26T12:00:00",
    "updatedAt": "2026-09-26T12:30:00"
  },
  "settings": {
    "theme": "dark",
    "viewMode": "split"
  }
}
```

---

# 19. MVP 범위

초기 버전에서는 다음 기능만 구현한다.

### 필수 기능

- Markdown Editor
- 실시간 Preview
- 기본 Markdown 문법
- Syntax Highlight
- Markdown Toolbar
- Split View
- Editor Only
- Preview Only
- 자동 저장
- Markdown Import
- Markdown Export
- Dark Mode
- Keyboard Shortcut
- 글자 / 단어 / 줄 수 표시
- Responsive UI

---

# 20. MVP 제외 기능

다음 기능은 초기 버전에서는 구현하지 않는다.

- 회원가입
- 로그인
- 서버 저장
- Cloud Sync
- 협업 편집
- 문서 공유
- 댓글
- 버전 관리
- AI 기능
- PDF Export

---

# 21. 향후 확장 기능

## Phase 2

### 문서 관리

여러 Markdown 문서를 관리할 수 있도록 한다.

예:

```text
My Documents

README.md
project.md
meeting-notes.md
```

---

### Document Outline

Heading을 분석하여 문서 목차를 자동 생성한다.

```text
1. Introduction
   1.1 Background
2. Architecture
3. API
```

클릭 시 해당 Heading 위치로 이동한다.

---

### Scroll Sync

Editor와 Preview의 스크롤 위치를 동기화한다.

---

### Command Palette

다음 단축키로 Command Palette를 호출한다.

```text
Ctrl + K
Cmd + K
```

예:

```text
> Export Markdown
> Toggle Dark Mode
> Insert Table
> Open Document
```

---

# 22. Phase 3

사용자 계정을 추가한다.

지원 기능:

- 로그인
- Cloud Save
- 여러 문서 관리
- 기기간 동기화
- 문서 공유

---

# 23. Phase 4

AI 기능을 추가할 수 있다.

예:

### AI Writing

- 문장 다듬기
- 문법 검사
- 요약
- 번역

### AI Markdown

사용자 입력:

```text
3열 5행 표 만들어줘
```

결과:

```markdown
| A | B | C |
|---|---|---|
|   |   |   |
|   |   |   |
|   |   |   |
|   |   |   |
|   |   |   |
```

---

# 24. 핵심 성공 지표

제품 초기 단계에서는 다음 지표를 추적한다.

### 사용성

- Editor 첫 입력까지 걸리는 시간
- Preview 사용 비율
- Toolbar 사용 비율

### 사용자 유지

- 재방문율
- 평균 편집 시간
- 작성 문서 수

### 기능 사용

- Markdown Export 횟수
- Import 횟수
- Dark Mode 사용 비율
- Shortcut 사용 빈도

---

# 25. Acceptance Criteria

MVP는 다음 조건을 만족하면 완료된 것으로 판단한다.

1. 사용자가 Markdown 문서를 작성할 수 있다.
2. 입력한 Markdown이 실시간으로 렌더링된다.
3. 기본 Markdown 문법이 정상적으로 표현된다.
4. 코드 블록 Syntax Highlight가 동작한다.
5. 작성 내용이 자동 저장된다.
6. 새로고침 후 문서가 복원된다.
7. `.md` 파일 Import가 가능하다.
8. `.md` 파일 Export가 가능하다.
9. Light / Dark Mode가 동작한다.
10. Desktop과 Mobile에서 사용할 수 있다.
11. Markdown 내 악성 HTML/Script가 실행되지 않는다.

---

# 26. 개발 우선순위

개발 순서는 다음과 같이 진행한다.

### P0 — Core

```text
Editor
↓
Markdown Parser
↓
Preview
↓
Split View
```

### P1 — Writing UX

```text
Toolbar
Keyboard Shortcut
Syntax Highlight
Auto Save
```

### P2 — File

```text
Import
Export
Drag & Drop
```

### P3 — UX

```text
Dark Mode
Responsive UI
Word Count
View Mode
```

---

# 27. 최종 제품 방향

Markdown Editor의 핵심은 많은 기능을 제공하는 것이 아니라

> **Markdown 문서를 빠르게 작성하고 즉시 결과를 확인할 수 있는 환경을 제공하는 것**

이다.

따라서 초기 버전에서는 협업, 계정, AI 등 복잡한 기능을 제외하고 다음 세 가지 경험에 집중한다.

**Write → Preview → Export**

이를 기반으로 향후 문서 관리, Cloud Sync, 협업 및 AI Writing 기능을 단계적으로 확장한다.