import { Connection, Client } from '@temporalio/client';
import debug from 'debug';

const dbglogger = debug('giant-monster-brawl:temoral-client');

dbglogger('Connecting to Temporal server.');

const connection = void (async () => {
  // Connect to the default Server location
  return await Connection.connect({ address: 'localhost:7233' });
  // In production, pass options to configure TLS and other settings:
  // {
  //   address: 'foo.bar.tmprl.cloud',
  //   tls: {}
  // }
})();

const client = new Client({
  connection,
  // namespace: 'foo.bar', // connects to 'default' namespace if not specified
});
dbglogger('Connected to Temporal server.');

export default client;
