import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'

export function renderHook(hookFn) {
    const result = { current: null };
    function TestComponent() {
        result.current = hookFn();
        return null;
    }
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
        root.render(<TestComponent />);
    });
    
    return { 
        result,
        unmount: () => {
             act(() => {
                 root.unmount();
             });
        }
    };
}

describe('renderHook sanity', () => {
    it('works with useState', () => {
        const { result } = renderHook(() => useState(42))
        expect(result.current[0]).toBe(42)
    })
})
