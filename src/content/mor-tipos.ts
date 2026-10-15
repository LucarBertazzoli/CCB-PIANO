/**
 * Materiais do MOR publicados pela CCB (planos de aula, atividades, cadernos).
 * Os arquivos ficam no Google Drive oficial da CCB; o app guarda só o
 * endereço de cada um e abre dentro da trilha.
 */
export interface MorFile {
  /** Id do arquivo no Google Drive (vazio quando `url` é usado). */
  id: string;
  title: string;
  type: 'pdf' | 'slides' | 'imagem';
  /** Endereço direto (arquivos que estão no próprio site da CCB). */
  url?: string;
}

export interface MorGroup {
  title: string;
  files: MorFile[];
}

export interface MorUnit {
  volume: 1 | 2;
  number: number;
  /** Título da unidade como está no plano de aula. */
  title: string;
  /** Id do plano de aula da unidade no Drive. */
  plano: string;
  groups: MorGroup[];
}

/** Para todos os volumes: manual das instrutoras e errata do site. */
export const MOR_GERAL: MorFile[] = [
  { id: '1MWAoiky0OV6NiCE4208y0A5eDl3MbyJy', title: 'Manual Digital para Instrutoras', type: 'pdf' },
  {
    id: '',
    title: 'Errata',
    type: 'pdf',
    url: 'https://congregacaocristanobrasil.org.br/assets/img/musica/documento1_errata3009.pdf',
  },
];

/** Página do Drive que mostra o arquivo (sem precisar de conta Google). */
export function morPreviewUrl(f: MorFile): string {
  return f.url ?? `https://drive.google.com/file/d/${f.id}/preview`;
}

export function morViewUrl(f: MorFile): string {
  return f.url ?? `https://drive.google.com/file/d/${f.id}/view`;
}
