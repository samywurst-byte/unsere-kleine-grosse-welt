/**
 * Vorschläge für freiwillige Zusatzmissionen. Sterne gibt es nur hierfür, nie für Routinen, Haushalt,
 * Mama-Zeit oder das Wochenende. Die Sterne gehören der ganzen Familie.
 */
export interface MissionSuggestion { title: string; icon: string; stars: number }

export const MISSION_SUGGESTIONS: MissionSuggestion[] = [
  { title: 'Den Tisch für alle decken', icon: 'utensils', stars: 1 },
  { title: 'Blumen gießen', icon: 'flower', stars: 1 },
  { title: 'Ein Bild für Oma oder Opa malen', icon: 'palette', stars: 1 },
  { title: 'Spielzeug zum Verschenken aussuchen', icon: 'toy-brick', stars: 2 },
  { title: 'Beim Kochen helfen', icon: 'soup', stars: 2 },
  { title: 'Den Vögeln Futter geben', icon: 'sprout', stars: 1 },
  { title: 'Einem Geschwisterkind vorlesen oder etwas zeigen', icon: 'book', stars: 2 },
  { title: 'Die Schuhe der ganzen Familie putzen', icon: 'footprints', stars: 2 },
];
