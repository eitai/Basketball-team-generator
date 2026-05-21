import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npx ts-node scripts/generate-hash.ts <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('\nADMIN_PASSWORD_HASH=' + hash + '\n');
console.log('Set this as an environment variable in your deployment.');
