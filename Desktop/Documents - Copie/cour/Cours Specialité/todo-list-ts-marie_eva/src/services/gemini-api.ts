import { GoogleGenerativeAI } from '@google/generative-ai';
import { Task } from '../models/models';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
if (!apiKey) {
  throw new Error('VITE_GEMINI_API_KEY n’est pas défini dans .env.local');
}

const genAI = new GoogleGenerativeAI(apiKey);

export default class GeminiAPI {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generatePlanning(tasks: Task[]): Promise<string> {
    try {
      const prompt = `Génère un planning basé sur ces tâches : ${JSON.stringify(tasks)}`;
      const result = await this.model.generateContent(prompt);
      return result.response?.text() || 'Aucune réponse générée';
    } catch (error) {
      console.error('Erreur lors de la génération du planning :', error);
      return 'Erreur lors de la génération du planning';
    }
  }

  async getResourcesForTask(description: string): Promise<string> {
    try {
      const prompt = `Quelles ressources sont nécessaires pour : ${description}`;
      const result = await this.model.generateContent(prompt);
      return result.response?.text() || 'Aucune ressource trouvée';
    } catch (error) {
      console.error('Erreur lors de la récupération des ressources :', error);
      return 'Erreur lors de la récupération des ressources';
    }
  }
}
