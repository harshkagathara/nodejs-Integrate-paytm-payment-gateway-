const express = require("express");
const app = express();


require('./App/DB');
require('./App/Routes')(app);

app.listen(3000, () => {
  console.log('Server is listening on Port :- 3000');
});
