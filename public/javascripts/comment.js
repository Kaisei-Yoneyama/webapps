'use strict';

const markedOptions = {
  highlight: (code, lang) => {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
};

marked.setOptions(markedOptions);

// const sanitizerOptions = {
//   FORBID_TAGS: [ 'style' ],
//   FORBID_ATTR: [ 'style' ]
// };

/** @type {HTMLTextAreaElement} */ 
const editor = document.getElementById('editor');

document.querySelectorAll('.comment').forEach((comment) => {
  const html = marked.parse(comment.textContent);
  const clean = DOMPurify.sanitize(html);
  // const clean = DOMPurify.sanitize(html, sanitizerOptions);
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

if (editor) {
  const easyMDE = new EasyMDE({
    status: false,
    element: editor,
    placeholder: '2000 字以内で入力してください。',
    toolbar: ['bold', 'italic', 'strikethrough', 'heading', 'code', 'unordered-list', 'ordered-list', 'quote', 'link', 'table', '|', 'preview'],
    renderingConfig: {
      markedOptions,
      singleLineBreaks: false,
      codeSyntaxHighlighting: true,
      sanitizerFunction: (html) => {
        return DOMPurify.sanitize(html);
        // return DOMPurify.sanitize(html, sanitizerOptions);
      }
    }
  });
}
