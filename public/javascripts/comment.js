'use strict';

const markedOptions = {
  langPrefix: 'hljs language-',
  highlight: (code, lang) => {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
};

marked.setOptions(markedOptions);

document.querySelectorAll('.comment').forEach((comment) => {
  const html = marked.parse(comment.textContent);
  const clean = DOMPurify.sanitize(html);
  comment.innerHTML = clean;
});

document.querySelectorAll('.comment table').forEach((table) => {
  table.classList.add('table', 'table-striped');
});

document.querySelectorAll('.comment th').forEach((th) => {
  th.setAttribute('scope', 'row');
});

document.querySelectorAll('.comment blockquote').forEach((blockquote) => {
  blockquote.classList.add('blockquote');
});

/** @type {HTMLTextAreaElement} */ 
const editor = document.getElementById('editor');

if (editor) {
  const easyMDE = new EasyMDE({
    status: false,
    element: editor,
    spellChecker: false,
    placeholder: '2000 字以内で入力してください。',
    previewClass: [ 'hljs', 'editor-preview' ],
    toolbar: [ 'bold', 'italic', 'strikethrough', 'heading', '|', 'code', 'quote', 'unordered-list', 'ordered-list', 'link', 'table', 'horizontal-rule', '|', 'preview', 'side-by-side', 'fullscreen', '|', 'undo', 'redo' ],
    renderingConfig: {
      markedOptions,
      singleLineBreaks: false,
      codeSyntaxHighlighting: true,
      sanitizerFunction: (html) => {
        return DOMPurify.sanitize(html);
      }
    }
  });
}
