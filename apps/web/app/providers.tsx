'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from "next-themes"
import { CopilotProvider } from './context/CopilotContext';
import { WebSocketProvider } from './context/WebSocketProvider';
import { ProjectSyncer } from './components/ProjectSyncer';

export function Providers({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
        >
            <WebSocketProvider>
                <CopilotProvider>
                    <ProjectSyncer />
                    {children}
                </CopilotProvider>
            </WebSocketProvider>
        </ThemeProvider>
    </Provider>;
}
