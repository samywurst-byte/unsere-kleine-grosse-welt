import type { Country } from '../types';

/**
 * Länder der Weltreise in fester Reihenfolge. Zuhause ist Deutschland (Land 01), die Reise beginnt mit Land 02.
 * Ids bleiben dauerhaft. Inhalte sind bewusst einfach: etwas zum Sagen, etwas zum Essen, etwas zum Spielen.
 */
export interface CountryInfo {
  country: Country;
  /** Zwei, drei kindgerechte Dinge zum Staunen. */
  facts: string[];
  /** Ideen für die Familie, wenn das Land freigeschaltet ist. */
  ideas: string[];
  /** Hintergrundfarbe der Passseite. */
  tone: 'sky' | 'sage' | 'rose' | 'terracotta' | 'gold' | 'lavender';
}

const c = (
  id: string, nameDe: string, capital: string, continent: string, flagEmoji: string, word: string, language: string,
  order: number, lat: number, lng: number,
): Country => ({ id, nameDe, capital, continent, flagEmoji, greeting: { word, language }, order, lat, lng });

export const WORLD: CountryInfo[] = [
  {
    country: c('country-italy', 'Italien', 'Rom', 'Europa', '🇮🇹', 'Ciao', 'Italienisch', 2, 41.9, 12.5), tone: 'terracotta',
    facts: ['Italien sieht auf der Landkarte aus wie ein Stiefel.', 'Pizza und Spaghetti kommen von hier.', 'In Venedig fahren Boote statt Autos.'],
    ideas: ['Zusammen eine Pizza belegen', 'Nudeln in verschiedenen Formen zählen', '„Ciao“ und „Grazie“ beim Abendessen sagen'],
  },
  {
    country: c('country-france', 'Frankreich', 'Paris', 'Europa', '🇫🇷', 'Bonjour', 'Französisch', 3, 48.9, 2.35), tone: 'sky',
    facts: ['In Paris steht der Eiffelturm, er ist so hoch wie 100 Häuser übereinander.', 'Ein Croissant ist ein Hörnchen aus Blätterteig.', 'Es gibt dort über 1000 Käsesorten.'],
    ideas: ['Croissants zum Frühstück', 'Einen Eiffelturm aus Bausteinen bauen', 'Käse probieren und raten'],
  },
  {
    country: c('country-denmark', 'Dänemark', 'Kopenhagen', 'Europa', '🇩🇰', 'Hej', 'Dänisch', 4, 55.7, 12.6), tone: 'rose',
    facts: ['Die Bausteine aus Dänemark kennt fast jedes Kind.', 'Dänemark hat ganz viel Küste und Strand.', 'Gemütlich heißt auf Dänisch „hyggelig“.'],
    ideas: ['Einen hyggeligen Abend mit Kerzen und Decken', 'Etwas Großes aus Bausteinen bauen', 'Zimtschnecken backen'],
  },
  {
    country: c('country-austria', 'Österreich', 'Wien', 'Europa', '🇦🇹', 'Servus', 'Deutsch', 5, 48.2, 16.4), tone: 'gold',
    facts: ['In Österreich spricht man auch Deutsch, aber manche Wörter sind anders.', 'Es gibt dort sehr hohe Berge, die Alpen.', 'Ein Kaiserschmarrn ist ein zerrupfter Pfannkuchen.'],
    ideas: ['Kaiserschmarrn machen', 'Berge aus Kissen bauen und besteigen', 'Wörter raten: Was ist ein „Paradeiser“?'],
  },
  {
    country: c('country-spain', 'Spanien', 'Madrid', 'Europa', '🇪🇸', 'Hola', 'Spanisch', 6, 40.4, -3.7), tone: 'terracotta',
    facts: ['In Spanien ist es oft sehr warm.', 'Dort isst man abends sehr spät.', 'Beim Flamenco wird getanzt und geklatscht.'],
    ideas: ['Flamenco klatschen und stampfen', 'Bunte Tapas-Teller mit kleinen Häppchen', 'Bis zehn auf Spanisch zählen'],
  },
  {
    country: c('country-sweden', 'Schweden', 'Stockholm', 'Europa', '🇸🇪', 'Hej', 'Schwedisch', 7, 59.3, 18.1), tone: 'sky',
    facts: ['Im Sommer wird es in Schweden fast gar nicht dunkel.', 'Elche leben dort im Wald.', 'Pippi Langstrumpf kommt aus Schweden.'],
    ideas: ['Eine Pippi-Langstrumpf-Geschichte vorlesen', 'Köttbullar mit Kartoffelbrei', 'Ein Elch-Bild malen'],
  },
  {
    country: c('country-greece', 'Griechenland', 'Athen', 'Europa', '🇬🇷', 'Yassou', 'Griechisch', 8, 38.0, 23.7), tone: 'sky',
    facts: ['Griechenland hat Tausende Inseln.', 'Vor sehr langer Zeit erfanden die Griechen die Olympischen Spiele.', 'Viele Häuser dort sind weiß mit blauen Dächern.'],
    ideas: ['Kleine Familien-Olympiade im Garten', 'Griechischer Salat mit Schafskäse', 'Weiß-blaue Häuser malen'],
  },
  {
    country: c('country-japan', 'Japan', 'Tokio', 'Asien', '🇯🇵', 'Konnichiwa', 'Japanisch', 9, 35.7, 139.7), tone: 'rose',
    facts: ['In Japan isst man mit Stäbchen.', 'Im Frühling blühen überall rosa Kirschbäume.', 'Japan besteht aus vielen Inseln.'],
    ideas: ['Mit Stäbchen essen üben', 'Einen Papierkranich falten', 'Reisbällchen formen'],
  },
  {
    country: c('country-kenya', 'Kenia', 'Nairobi', 'Afrika', '🇰🇪', 'Jambo', 'Swahili', 10, -1.3, 36.8), tone: 'gold',
    facts: ['In Kenia leben Löwen, Elefanten und Giraffen in der Savanne.', 'Die schnellsten Läufer der Welt kommen oft von hier.', 'Der Äquator läuft mitten durch das Land.'],
    ideas: ['Tiere der Savanne nachspielen', 'Ein Wettrennen im Garten', '„Jambo“ und „Asante“ lernen'],
  },
  {
    country: c('country-brazil', 'Brasilien', 'Brasília', 'Südamerika', '🇧🇷', 'Olá', 'Portugiesisch', 11, -15.8, -47.9), tone: 'sage',
    facts: ['In Brasilien wächst der größte Regenwald der Welt.', 'Dort leben bunte Papageien und Faultiere.', 'Fußball ist dort ganz besonders beliebt.'],
    ideas: ['Regenwald-Geräusche machen', 'Obstsalat mit Mango und Banane', 'Fußball im Garten'],
  },
  {
    country: c('country-canada', 'Kanada', 'Ottawa', 'Nordamerika', '🇨🇦', 'Hello', 'Englisch und Französisch', 12, 45.4, -75.7), tone: 'terracotta',
    facts: ['Kanada ist riesig und hat sehr viele Seen.', 'Aus dem Saft der Ahornbäume macht man Sirup.', 'Dort leben Bären und Biber.'],
    ideas: ['Pfannkuchen mit Ahornsirup', 'Einen Biberdamm aus Stöcken bauen', 'Ahornblätter sammeln'],
  },
  {
    country: c('country-australia', 'Australien', 'Canberra', 'Australien', '🇦🇺', "G'day", 'Englisch', 13, -35.3, 149.1), tone: 'gold',
    facts: ['Kängurus tragen ihre Babys im Beutel.', 'Wenn bei uns Winter ist, ist dort Sommer.', 'Australien ist ein Land und ein ganzer Kontinent.'],
    ideas: ['Wie ein Känguru hüpfen', 'Ein Strandpicknick im Wohnzimmer', 'Koalas malen'],
  },
];

export const WORLD_BY_ID = new Map(WORLD.map((w) => [w.country.id, w]));
