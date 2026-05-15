import { Component, OnInit, signal } from '@angular/core';
import { Snippetservice, ApiScript } from '../../services/snippet';
import { FormsModule } from '@angular/forms';
import { Snippet } from '../../Model/snippets';

@Component({
  selector: 'app-snippets',
  imports: [FormsModule],
  templateUrl: './snippets.html',
  styleUrl: './snippets.css',
})
export class Snippets implements OnInit {
  title = '';
  text = '';
  sql = '';
  selectedFile: File | null = null;

  snippets = signal<Snippet[]>([]);
  snippetSearch = signal<string>('');
  editingSnippet = signal<Snippet | null>(null);
  savedMessage = signal<string>('');
  lastUpdateTime = '';

  constructor(private service: Snippetservice) {}

  ngOnInit() {
    this.load();
  }

  // 🔥 تحويل من API للشكل القديم
  mapToSnippet(api: ApiScript): Snippet {
    return {
      id: api.id,
      title: api.title,
      text: api.description,
      sql: api.sqlContent,
      fileUrl: api.fileUrl,
    };
  }

  showSaveMessage() {
    this.savedMessage.set('✓ Data saved successfully');
    setTimeout(() => this.savedMessage.set(''), 2000);
  }

  // ✅ LOAD FROM API
  load() {
    this.service.getAll().subscribe({
      next: (res) => {
        const mapped = res.map((s) => this.mapToSnippet(s));
        this.snippets.set(mapped);
      },
    });
  }

  // ✅ CREATE
  save() {
    if (!this.title.trim() || !this.sql.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('Title', this.title);
    formData.append('Description', this.text);
    formData.append('SqlContent', this.sql);

    if (this.selectedFile) {
      formData.append('ScriptFile', this.selectedFile);
    }

    this.service.create(formData).subscribe({
      next: () => {
        this.title = '';
        this.text = '';
        this.sql = '';
        this.selectedFile = null;

        this.load();
        this.showSaveMessage();
      },
      error: (error) => {
        console.error('Error saving script:', error);
        alert('حدث خطأ أثناء الحفظ. تأكد من أنك مسجل الدخول وأن بريدك الإلكتروني موجود.');
      },
    });
  }

  // ✅ DELETE
  deleteSnippet(id: number) {
    if (confirm('Are you sure you want to delete this snippet?')) {
      this.service.delete(id).subscribe(() => {
        this.snippets.update((list) => list.filter((s) => s.id !== id));
        this.showSaveMessage();
      });
    }
  }

  // ✅ EDIT START
  startEdit(snippet: Snippet) {
    this.editingSnippet.set({ ...snippet });
  }

  // ✅ UPDATE
  saveEdit() {
    const editing = this.editingSnippet();
    if (!editing) return;

    if (!editing.title.trim() || !editing.sql.trim()) {
      alert('Please fill in the required fields before saving.');
      return;
    }

    const formData = new FormData();
    formData.append('Title', editing.title);
    formData.append('Description', editing.text);
    formData.append('SqlContent', editing.sql);

    this.service.update(editing.id, formData).subscribe(() => {
      this.load();
      this.editingSnippet.set(null);
      this.showSaveMessage();
    });
  }

  cancelEdit() {
    this.editingSnippet.set(null);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;

      this.sql = content;
    };

    reader.readAsText(file);
  }

  // ✅ DOWNLOAD
  downloadSQL(snippet: Snippet) {
    if (snippet.fileUrl) {
      window.open(snippet.fileUrl, '_blank');
      return;
    }

    if (!snippet.sql) {
      alert('لا توجد بيانات');
      return;
    }

    const blob = new Blob([snippet.sql], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (snippet.title || 'script') + '.sql';
    a.click();

    window.URL.revokeObjectURL(url);
  }

  // 🔍 SEARCH
  get filteredSnippets(): Snippet[] {
    const search = this.snippetSearch().trim().toLowerCase();
    if (!search) return this.snippets();

    return this.snippets().filter((s) => s.title.toLowerCase().includes(search));
  }
}
