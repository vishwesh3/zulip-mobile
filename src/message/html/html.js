/* eslint-disable */

export default content => `
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<body>
  <div id="spinner-older" class="hidden loading-spinner"></div>
  <div id="message-list"><div id="message-list-child">${content}</div></div>
  <div id="spinner-newer" class="hidden loading-spinner"></div>
</body>
`;
