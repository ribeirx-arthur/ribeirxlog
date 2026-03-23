
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const apiKey = "AIzaSyDsGzBaAqZVS-8ZsG532_fMesVr6HLRr9E";

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        let output = "AVAILABLE MODELS:\n";
        if (data.models) {
            data.models.forEach(m => {
                output += `- ${m.name}\n`;
            });
        } else {
            output += JSON.stringify(data, null, 2);
        }
        fs.writeFileSync("models_list.txt", output);
    } catch (e) {
        fs.writeFileSync("models_list.txt", "ERROR: " + e.message);
    }
}

listModels();
