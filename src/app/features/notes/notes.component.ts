import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NoteService } from '../../core/services/note.service';
import { Note } from '../../models/note.model';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.css'
})
export class NotesComponent implements OnInit {
  @ViewChild('contentEditor') private readonly contentEditor?: ElementRef<HTMLDivElement>;

  notes: Note[] = [];
  title = '';
  content = '';
  editingNoteId: number | null = null;
  loading = false;
  error = '';

  constructor(
    private readonly noteService: NoteService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotes();
  }

  loadNotes(): void {
    this.loading = true;
    this.error = '';

    this.noteService.getNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.error = this.messageFromError(error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveNote(): void {
    const title = this.title.trim();
    const content = this.readEditorContent();

    if (!title) {
      return;
    }

    if (this.editingNoteId) {
      this.updateNote(this.editingNoteId, title, content);
      return;
    }

    this.noteService.addNote(title, content).subscribe({
      next: (note) => {
        this.notes = [note, ...this.notes];
        this.resetForm();
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.error = this.messageFromError(error);
        this.cdr.detectChanges();
      }
    });
  }

  editNote(note: Note): void {
    this.editingNoteId = note.id;
    this.title = note.title;
    this.content = this.sanitizeNoteHtml(note.content || '');
    this.setEditorContent(this.content);
    this.error = '';
    this.focusEditor();
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.resetForm();
    this.cdr.detectChanges();
  }

  deleteNote(id: number): void {
    this.noteService.deleteNote(id).subscribe({
      next: () => {
        this.notes = this.notes.filter((note) => note.id !== id);
        if (this.editingNoteId === id) {
          this.resetForm();
        }
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.error = this.messageFromError(error);
        this.cdr.detectChanges();
      }
    });
  }

  syncContent(): void {
    this.content = this.readEditorContent();
  }

  handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
    this.syncContent();
  }

  applyFormat(command: 'bold' | 'italic' | 'underline'): void {
    this.focusEditor();
    document.execCommand(command, false);
    this.syncContent();
  }

  insertCodeBlock(): void {
    const editor = this.contentEditor?.nativeElement;
    if (!editor) {
      return;
    }

    this.focusEditor();

    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    const nextLine = document.createElement('p');

    pre.className = 'code-block';
    code.className = 'language-code';
    code.textContent = selectedText || 'Nhập code ở đây';
    pre.appendChild(code);
    nextLine.appendChild(document.createElement('br'));

    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (range && editor.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(nextLine);
      range.insertNode(pre);
    } else {
      editor.append(pre, nextLine);
    }

    this.selectNodeContent(code);
    this.syncContent();
  }

  formatNoteContent(content: string): string {
    if (typeof document === 'undefined') {
      return content;
    }

    const sanitized = this.sanitizeNoteHtml(content);
    const template = document.createElement('template');
    template.innerHTML = sanitized;

    for (const code of Array.from(template.content.querySelectorAll('pre code'))) {
      const text = code.textContent || '';
      code.classList.add('language-code');
      code.innerHTML = this.highlightCode(text);
      code.parentElement?.classList.add('code-block');
    }

    return template.innerHTML;
  }

  private updateNote(id: number, title: string, content: string): void {
    this.noteService.updateNote(id, title, content).subscribe({
      next: (updated) => {
        this.notes = this.notes.map((note) => note.id === updated.id ? updated : note);
        this.resetForm();
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.error = this.messageFromError(error);
        this.cdr.detectChanges();
      }
    });
  }

  private readEditorContent(): string {
    return this.sanitizeNoteHtml(this.contentEditor?.nativeElement.innerHTML.trim() || '');
  }

  private clearEditor(): void {
    if (this.contentEditor?.nativeElement) {
      this.contentEditor.nativeElement.textContent = '';
    }
  }

  private setEditorContent(content: string): void {
    if (this.contentEditor?.nativeElement) {
      this.contentEditor.nativeElement.innerHTML = this.sanitizeNoteHtml(content);
    }
  }

  private resetForm(): void {
    this.editingNoteId = null;
    this.title = '';
    this.content = '';
    this.clearEditor();
  }

  private focusEditor(): void {
    this.contentEditor?.nativeElement.focus();
  }

  private selectNodeContent(node: Node): void {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private sanitizeNoteHtml(content: string): string {
    if (typeof document === 'undefined') {
      return content;
    }

    const template = document.createElement('template');
    template.innerHTML = content;
    const sanitized = document.createElement('div');

    for (const child of Array.from(template.content.childNodes)) {
      sanitized.appendChild(this.sanitizeNode(child));
    }

    return sanitized.innerHTML.trim();
  }

  private sanitizeNode(node: Node): Node {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || '');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return document.createDocumentFragment();
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if ([
      'script',
      'style',
      'iframe',
      'object',
      'embed',
      'svg',
      'math',
      'img',
      'video',
      'audio',
      'source',
      'link',
      'meta',
      'base',
      'form',
      'input',
      'button',
      'textarea',
      'select',
      'option'
    ].includes(tag)) {
      return document.createDocumentFragment();
    }

    if (tag === 'br') {
      return document.createElement('br');
    }

    if (tag === 'pre') {
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      pre.className = 'code-block';
      code.className = 'language-code';
      code.textContent = element.textContent || '';
      pre.appendChild(code);
      return pre;
    }

    if (tag === 'code') {
      const code = document.createElement('code');
      code.className = 'language-code';
      code.textContent = element.textContent || '';
      return code;
    }

    if (['b', 'strong', 'i', 'em', 'u', 'p', 'div'].includes(tag)) {
      const safeElement = document.createElement(tag);
      for (const child of Array.from(element.childNodes)) {
        safeElement.appendChild(this.sanitizeNode(child));
      }
      return safeElement;
    }

    const fragment = document.createDocumentFragment();
    for (const child of Array.from(element.childNodes)) {
      fragment.appendChild(this.sanitizeNode(child));
    }
    return fragment;
  }

  private highlightCode(code: string): string {
    const tokenPattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`[^`]*`|'[^'\n]*(?:\\.[^'\n]*)*'|"[^"\n]*(?:\\.[^"\n]*)*")|(\b\d+(?:\.\d+)?\b)|\b(const|let|var|function|return|if|else|for|while|class|new|import|from|export|interface|type|public|private|readonly|async|await|try|catch|throw|true|false|null|undefined)\b/g;
    let highlighted = '';
    let lastIndex = 0;

    for (const match of code.matchAll(tokenPattern)) {
      const index = match.index ?? 0;
      highlighted += this.escapeHtml(code.slice(lastIndex, index));

      const [token, comment, stringValue, numberValue, keyword] = match;
      const className = comment
        ? 'hl-comment'
        : stringValue
          ? 'hl-string'
          : numberValue
            ? 'hl-number'
            : keyword
              ? 'hl-keyword'
              : '';

      highlighted += className
        ? `<span class="${className}">${this.escapeHtml(token)}</span>`
        : this.escapeHtml(token);
      lastIndex = index + token.length;
    }

    return highlighted + this.escapeHtml(code.slice(lastIndex));
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private messageFromError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return String(error.error.message);
    }

    return 'Không tải được ghi chú. Hãy đăng nhập và kiểm tra backend.';
  }
}
