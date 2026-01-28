declare module 'mammoth' {
    export interface MammothResult {
        value: string;
        messages: any[];
    }

    export interface ExtractOptions {
        arrayBuffer: ArrayBuffer;
    }

    export function extractRawText(input: ExtractOptions): Promise<MammothResult>;
}
