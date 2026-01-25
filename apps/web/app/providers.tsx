'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from "next-themes"
import { CopilotProvider } from './context/CopilotContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
        >
            <CopilotProvider>
                {children}
            </CopilotProvider>
        </ThemeProvider>
    </Provider>;
}
