import process from 'node:process';

process.stdin.on('data', (data) => {
  data = data.toString();
  console.log('parent -> child: ' + data);
});
