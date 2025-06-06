import { ClientProxyFactory, Transport, TcpClientOptions } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

async function testMicroservice() {
  console.log('Initializing test client...');
  
  const client = ClientProxyFactory.create({
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3001,
    }
  } as TcpClientOptions);

  try {
    console.log('Connecting to microservice...');
    await client.connect();
    console.log('Successfully connected to microservice');

    console.log('Sending test message to microservice...');
    const result = await firstValueFrom(
      client.send('order.findAll', { page: 1, pageSize: 1 })
    );
    
    console.log('Received response from microservice:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error connecting to microservice:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('Client connection closed');
  }
}

testMicroservice(); 