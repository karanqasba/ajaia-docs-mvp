# 3-5 Minute Walkthrough Script

Hi, this is Karan. This is my Ajaia Docs MVP, a lightweight collaborative document editor built inside the timebox.

The core flow starts with the seeded user dropdown. I intentionally used mocked users instead of full authentication so I could focus on document creation, editing, persistence, file import, and sharing behavior.

First, I create a new document. I can rename it, add rich-text content, and use formatting like bold, italic, headings, bullets, and numbered lists. When I click save, the document is persisted in Supabase. If I refresh the page or reopen the document, the content and formatting remain available.

Next, I can import a `.txt` or `.md` file. For this MVP, I limited upload support to text-based files because it is reliable and easy for reviewers to validate. The uploaded file becomes a new editable document.

For sharing, I can select another seeded user and share the document. Then I switch to that user from the dropdown. The document now appears under shared documents, making the distinction between owned and shared access visible.

The main functionality working end to end is document create, rename, edit, save, reopen, text import, and basic sharing.

I intentionally deprioritized real-time collaboration, Google authentication, DOCX parsing, comments, and enterprise permissions. Those features are valuable, but they would increase risk inside this timebox. I chose to deliver a smaller product slice that works reliably.

Key implementation decisions: the app uses React and Vite for speed, TipTap for the editor experience, and Supabase for persistence. Documents are stored with title, owner, and rich-text HTML content. Sharing data is stored separately in a document_shares table.

AI helped me move faster in scoping, schema design, UI scaffolding, and documentation. I rejected AI-generated ideas that expanded scope too much, especially full auth and real-time editing, because they would distract from the core assignment.

If I had another 2-4 hours, I would add viewer/editor permissions, version history, comments, and real-time presence indicators.
