'use strict';

hljs.highlightAll();

document.querySelectorAll('.comment').forEach((comment) => {
  comment.innerHTML = DOMPurify.sanitize(marked.parse(comment.textContent));
});

document.querySelectorAll('.comment pre').forEach((pre) => {
  pre.classList.add('rounded');
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