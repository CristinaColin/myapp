// Listen for messages from the parent process
process.on('message', (message) => {
  console.log(`Message from parent: ${message}`);

  // Send a response back to the parent
  process.send('Hello from child');
});