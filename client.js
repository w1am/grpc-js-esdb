import { EventStoreDBClient, jsonEvent, FORWARDS, START } from '@eventstore/db-client';

const client = EventStoreDBClient.connectionString`esdb://localhost:2113?tls=false`;

async function main() {
    const streamName = 'my_stream';

    // Append events
    const events = [];
    for (let i = 0; i < 2000; i++) {
        events.push(jsonEvent({
            type: 'test-event',
            data: { index: i },
        }));
    }

    await client.appendToStream(streamName, events);

    // Reading from the stream
    const stream = client.readStream(streamName, { direction: FORWARDS, fromRevision: START });

    let count = 0;
    for await (const { event } of stream) {
        console.log(`Event #${count}: ${event.type}`);
        count++;

        if (count === 12) {
            console.log('Pausing for 30 seconds. Manually gracefully stop the Docker container now...');
            await pauseWithTimer(30000); 
        }
    }
}

async function pauseWithTimer(duration) {
    return new Promise(resolve => {
        let remaining = duration;
        const interval = setInterval(() => {
            remaining -= 1000;
            console.log(`Time remaining: ${remaining / 1000} seconds`);
            if (remaining <= 0) {
                clearInterval(interval);
                resolve();
            }
        }, 1000);
    });
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
