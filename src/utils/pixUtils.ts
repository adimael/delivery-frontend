import QRCode from 'qrcode';

export interface PixData {
  chavePix: string;
  valor?: number;
  nomeRecebedor: string;
  cidadeRecebedor: string;
  cepRecebedor?: string;
  txid?: string;
  descricao?: string;
}

const createField = (id: string, value: string): string => {
  if (value.length > 99) {
    throw new Error(`Campo PIX ${id} excede o limite permitido.`);
  }

  return `${id}${value.length.toString().padStart(2, '0')}${value}`;
};

const textoPix = (texto: string, limite: number): string => texto
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^A-Za-z0-9 $%*+\-./:]/g, '')
  .toUpperCase()
  .trim()
  .substring(0, limite);

const calculateCRC16 = (data: string): string => {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

const txidPix = (valor?: string): string => {
  const normalizado = String(valor || '')
    .replace(/[^A-Za-z0-9]/g, '')
    .substring(0, 25);

  return normalizado || '***';
};

const chavePixValida = (chave: string): string => {
  const normalizada = chave.trim();
  if (normalizada === '' || normalizada.length > 77) {
    throw new Error('A chave PIX configurada é inválida.');
  }

  return normalizada;
};

export const generatePixPayload = ({
  chavePix,
  valor,
  nomeRecebedor,
  cidadeRecebedor,
  cepRecebedor,
  txid,
  descricao,
}: PixData): string => {
  const chave = chavePixValida(chavePix);
  const nome = textoPix(nomeRecebedor, 25);
  const cidade = textoPix(cidadeRecebedor, 15);
  const valorPix = Number(valor);
  if (nome === '') throw new Error('Configure o nome do recebedor PIX.');
  if (cidade === '') throw new Error('Configure a cidade do recebedor PIX.');
  if (!Number.isFinite(valorPix) || valorPix <= 0 || valorPix > 9999999999.99) {
    throw new Error('O valor do PIX é inválido.');
  }

  let payload = createField('00', '01');
  let informacoesConta = createField('00', 'BR.GOV.BCB.PIX')
    + createField('01', chave);
  const limiteDescricao = Math.min(40, 99 - informacoesConta.length - 4);
  if (descricao && limiteDescricao > 0) {
    informacoesConta += createField('02', textoPix(descricao, limiteDescricao));
  }
  payload += createField(
    '26',
    informacoesConta,
  );
  payload += createField('52', '0000');
  payload += createField('53', '986');
  payload += createField('54', valorPix.toFixed(2));
  payload += createField('58', 'BR');
  payload += createField('59', nome);
  payload += createField('60', cidade);
  if (cepRecebedor?.trim()) {
    payload += createField('61', cepRecebedor.replace(/\D/g, '').substring(0, 8));
  }
  payload += createField('62', createField('05', txidPix(txid)));
  payload += '6304';

  return payload + calculateCRC16(payload);
};

export const generatePixQRCode = (pixPayload: string): Promise<string> => (
  QRCode.toDataURL(pixPayload, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M',
  })
);
