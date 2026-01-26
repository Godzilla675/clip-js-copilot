
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

async function checkMethods() {
    console.log('--- Anthropic ---');
    try {
        const anthropic = new Anthropic({ apiKey: 'dummy' });
        // @ts-ignore
        if (anthropic.models && anthropic.models.list) {
            console.log('Anthropic has client.models.list');
        } else {
             console.log('Anthropic DOES NOT have client.models.list');
             console.log('Keys:', Object.keys(anthropic));
        }
    } catch (e) {
        console.log('Anthropic error:', e);
    }

    console.log('--- OpenAI ---');
    try {
        const openai = new OpenAI({ apiKey: 'dummy' });
         // @ts-ignore
        if (openai.models && openai.models.list) {
             console.log('OpenAI has client.models.list');
        } else {
             console.log('OpenAI DOES NOT have client.models.list');
             console.log('Keys:', Object.keys(openai));
        }
    } catch (e) {
        console.log('OpenAI error:', e);
    }

    console.log('--- Gemini ---');
    try {
        const gemini = new GoogleGenAI({ apiKey: 'dummy' });
         // @ts-ignore
        if (gemini.models && gemini.models.list) {
             console.log('Gemini has client.models.list');
        } else {
             console.log('Gemini DOES NOT have client.models.list');
             console.log('Keys:', Object.keys(gemini));
        }
    } catch (e) {
        console.log('Gemini error:', e);
    }
}

checkMethods();
