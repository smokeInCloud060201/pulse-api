import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import graphqlWorker from 'monaco-graphql/esm/graphql.worker?worker';

// Configure Monaco Environment for Workers
self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'graphql') {
      return new graphqlWorker();
    }
    return new editorWorker();
  }
};

// Use the local monaco-editor instead of loading from CDN
loader.config({ monaco });

// This sets up the GraphQL language mode
import 'monaco-graphql/initializeMode';

export { monaco };
