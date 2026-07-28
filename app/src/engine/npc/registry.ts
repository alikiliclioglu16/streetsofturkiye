/**
 * Featured NPCs.
 *
 * People standing at their posts along the street. They are not guides, they
 * carry no content, and nothing about the city depends on them — they exist so
 * a child sees that somebody lives here.
 *
 * The animation whitelist is the point of this file. A soldier model ships with
 * twenty clips, fourteen of which are attacks, kicks and taunts. Those clips are
 * stripped from the delivered files as well, because a rule that lives only in
 * code eventually gets broken by someone who did not read the code.
 */

export interface FeaturedNpc {
  readonly id: string;
  readonly label: string;
  readonly modelUrl: string;
  readonly checksum: string;
  readonly triangles: number;
  readonly transferBytes: number;
  /** Briefed height in metres. */
  readonly heightMeters: number;
  /** The only clips the engine may play, in the order it cycles them. */
  readonly clips: readonly string[];
  /** Recorded so the reason survives the next re-export. */
  readonly excludedClips: Readonly<Record<string, string>>;
}

export const FEATURED_NPCS: readonly FeaturedNpc[] = [
  {
    id: 'featured_soldier',
    label: 'Soldier',
    modelUrl: '/assets/npc/npc_featured_soldier.glb',
    checksum: '31ce55da676dcae116f62ec92781a9c18d0f471ccffb6f284ad5399853c546d8',
    triangles: 38_062,
    transferBytes: 3946900,
    heightMeters: 1.7,
    clips: ['Idle_9', 'Look_Around_Dumbfounded', 'Walking'],
    excludedClips: {
      'Attack, Archery_Shot, Axe_Spin_Attack, Spartan_Kick and nine more':
        'combat, taunts and shouting have no place in a street a six-year-old walks down',
      'Axe_Breathe_and_Look_Around, Combat_Idle_Turn_Left':
        'approved by the manifest, but a soldier holding an axe buys nothing here',
    },
  },
  {
    id: 'featured_traveler',
    label: 'Traveller',
    modelUrl: '/assets/npc/npc_featured_traveler.glb',
    checksum: 'ccc179ffadff4c41d6040d80ea0b91514de4ce877b33ee0f8701392d35439a08',
    triangles: 14_614,
    transferBytes: 1240320,
    heightMeters: 1.7,
    clips: ['Idle_4', 'Short_Breathe_and_Look_Around', 'Talk_with_Hands_Open', 'Walking'],
    excludedClips: {},
  },
  {
    id: 'featured_craftsman_male',
    label: 'Craftsman',
    modelUrl: '/assets/npc/npc_featured_craftsman_male.glb',
    checksum: '825af04a1aacef6a5753a7d32d5d71066c6fef54c360ed144049ac59afd78206',
    triangles: 21_048,
    transferBytes: 2111296,
    heightMeters: 1.7,
    clips: ['Idle_7', 'Look_Around_Dumbfounded', 'Talk_Passionately', 'Walking'],
    excludedClips: {
      'Heavy_Hammer_Swing, Jump_Over_Obstacle_2, Pull_Radish':
        'a swinging hammer reads as violence at a distance, and the other two are not street behaviour',
    },
  },
];

export function npcById(id: string): FeaturedNpc | undefined {
  return FEATURED_NPCS.find((npc) => npc.id === id);
}

/** The engine will not play a clip that is not on the whitelist. */
export function isApprovedClip(npc: FeaturedNpc, clipName: string): boolean {
  return npc.clips.includes(clipName);
}
