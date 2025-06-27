export const mockFileTreeHistory = [
    { name: "root", type: "folder", children: [ { name: "package.json", type: "file", status: "modified" }, { name: "src", type: "folder", children: [{ name: "App.tsx", type: "file", status: "added" }] }] },
    { name: "root", type: "folder", children: [ { name: "package.json", type: "file", status: "equal" }, { name: "src", type: "folder", children: [{ name: "App.tsx", type: "file", status: "modified" }, { name: "parser.ts", type: "file", status: "added" }] }] },
    { name: "root", type: "folder", children: [ { name: "package.json", type: "file", status: "modified" }, { name: "src", type: "folder", children: [{ name: "App.tsx", type: "file", status: "modified" }, { name: "parser.ts", type: "file", status: "equal" }, { name: "store.ts", type: "file", status: "added" }] }] },
    { name: "root", type: "folder", children: [ { name: "README.md", type: "file", status: "added" }, { name: "package.json", type: "file", status: "equal" }, { name: "src", type: "folder", children: [{ name: "App.tsx", type: "file", status: "equal" }, { name: "parser.ts", type: "file", status: "equal" }, { name: "store.ts", type: "file", status: "equal" }] }] },
    { name: "root", type: "folder", children: [ { name: "README.md", type: "file", status: "equal" }, { name: "package.json", type: "file", status: "equal" }, { name: "src", type: "folder", children: [{ name: "App.tsx", type: "file", status: "modified" }, { name: "parser.ts", type: "file", status: "equal" }, { name: "store.ts", type: "file", status: "equal" }, { name: "theme.ts", type: "file", status: "added" }] }] },
    { name: "root", type: "folder", children: [ { name: ".github", type: "folder", children: [{ name: "workflows", type: "folder", children: [{ name: "ci.yml", type: "file", status: "added" }] }] }, { name: "README.md", type: "file", status: "equal" }, { name: "package.json", type: "file", status: "equal" }, { name: "src", type: "folder", children: [{ name: "App.tsx", type: "file", status: "equal" }, { name: "parser.ts", type: "file", status: "equal" }, { name: "store.ts", type: "file", status: "equal" }, { name: "theme.ts", type: "file", status: "equal" }] }] },
    { name: "root", type: "folder", children: [ { name: ".github", type: "folder", children: [{ name: "workflows", type: "folder", children: [{ name: "ci.yml", type: "file", status: "equal" }] }] }, { name: "README.md", type: "file", status: "equal" }, { name: "package.json", type: "file", status: "equal" }, { name: "src", type: "folder", children: [{ name: "App.tsx", type: "file", status: "equal" }, { name: "parser.ts", type: "file", status: "equal" }, { name: "store.ts", type: "file", status: "equal" }, { name: "theme.ts", type: "file", status: "equal" }, { name: "api.ts", type: "file", status: "added" }] }] },
];

export const mockArchitectureNotes = [
    "**Initial Scaffolding:** This commit establishes the foundational architecture. The diagram shows a single component, **`App.tsx`**, which serves as the root of the application and initially contains all UI and logic.",
    "**Decoupling with a Service Module:** The introduction of **`parser.ts`** marks the first major architectural improvement. As shown in the diagram, a new link is formed from **`App.tsx`**, which now offloads complex diff-parsing logic to this dedicated service module. This improves modularity and testability.",
    "**Centralized State Management:** Adding **`store.ts`** signifies a shift to a more robust state pattern. A new **`Store`** node appears in the diagram, and **`App.tsx`** now connects to it, centralizing data flow and making the architecture more scalable by creating a single source of truth.",
    "**Improving Developer Experience:** No change is visible in the code architecture diagram. This commit adds a `README.md` file, which is a crucial project architecture decision for maintainability but does not alter the component structure.",
    "**Creating a Design System Foundation:** The new **`theme.ts`** module appears, centralizing design tokens (colors, fonts). **`App.tsx`** now links to this module, ensuring UI consistency and making sweeping visual changes easier to implement.",
    "**Automating Quality with DevOps:** This change is external to the application's runtime architecture and thus not visible in the diagram. Adding a CI/CD pipeline in `.github/` automates testing and deployment, a critical enhancement to the development process itself.",
    "**Implementing a Dedicated API Layer:** The creation of **`api.ts`** establishes a formal API abstraction. The new **`API`** node is now connected to **`App.tsx`**, which delegates all network communication to this layer. This decouples the UI from the specifics of data fetching.",
];

export const mockArchitectureDiagrams = [
    { nodes: [{ id: 'App', label: 'App.tsx', x: 250, y: 150 }], links: [] },
    { nodes: [{ id: 'App', label: 'App.tsx', x: 250, y: 80 }, { id: 'Parser', label: 'parser.ts', x: 250, y: 220 }], links: [{ source: 'App', target: 'Parser' }] },
    { nodes: [{ id: 'App', label: 'App.tsx', x: 150, y: 150 }, { id: 'Parser', label: 'parser.ts', x: 350, y: 80 }, { id: 'Store', label: 'store.ts', x: 350, y: 220 }], links: [{ source: 'App', target: 'Parser' }, { source: 'App', target: 'Store' }] },
    { nodes: [{ id: 'App', label: 'App.tsx', x: 150, y: 150 }, { id: 'Parser', label: 'parser.ts', x: 350, y: 80 }, { id: 'Store', label: 'store.ts', x: 350, y: 220 }], links: [{ source: 'App', target: 'Parser' }, { source: 'App', target: 'Store' }] },
    { nodes: [{ id: 'App', label: 'App.tsx', x: 150, y: 150 }, { id: 'Parser', label: 'parser.ts', x: 350, y: 50 }, { id: 'Store', label: 'store.ts', x: 350, y: 150 }, { id: 'Theme', label: 'theme.ts', x: 350, y: 250 }], links: [{ source: 'App', target: 'Parser' }, { source: 'App', target: 'Store' }, { source: 'App', target: 'Theme' }] },
    { nodes: [{ id: 'App', label: 'App.tsx', x: 150, y: 150 }, { id: 'Parser', label: 'parser.ts', x: 350, y: 50 }, { id: 'Store', label: 'store.ts', x: 350, y: 150 }, { id: 'Theme', label: 'theme.ts', x: 350, y: 250 }], links: [{ source: 'App', target: 'Parser' }, { source: 'App', target: 'Store' }, { source: 'App', target: 'Theme' }] },
    { nodes: [{ id: 'App', label: 'App.tsx', x: 150, y: 150 }, { id: 'Parser', label: 'parser.ts', x: 350, y: 50 }, { id: 'Store', label: 'store.ts', x: 350, y: 125 }, { id: 'Theme', label: 'theme.ts', x: 350, y: 200 }, { id: 'API', label: 'api.ts', x: 350, y: 275 }], links: [{ source: 'App', target: 'Parser' }, { source: 'App', target: 'Store' }, { source: 'App', target: 'Theme' }, { source: 'App', target: 'API' }] },
];

export const mockFileContentBefore = `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
      </header>
    </div>
  );
}

export default App;`;

export const mockFileContentAfter = `import React, { useState, useEffect } from 'react';
import './App.css';
import { parseData } from './parser';
import { store } from './store';
import { theme } from './theme';
import { api } from './api';

function App() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    api.fetchData().then(setData);
  }, []);

  return (
    <div className="App" style={theme.styles}>
      <header className="App-header">
        <p>
          Welcome to the enhanced application!
        </p>
        {data && <div>{parseData(data)}</div>}
      </header>
    </div>
  );
}

export default App;`;