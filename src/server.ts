import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`QR redirect service listening on port ${port}`);
});
