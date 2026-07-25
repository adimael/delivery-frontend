import QRCode from 'qrcode';

export interface PixData {
  chavePix: string;
  valor?: number;
  nomeRecebedor: string;
  cidadeRecebedor: string;
  cepRecebedor?: string;
  txid?: string;
}

const createField = (id: string, value: string): string => (
  `${id}${value.length.toString().padStart(2, '0')}${value}`
);

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

export const generatePixPayload = ({
  chavePix,
  valor,
  nomeRecebedor,
  cidadeRecebedor,
  cepRecebedor,
  txid,
}: PixData): string => {
  let payload = createField('00', '01');
  payload += createField('01', valor && valor > 0 ? '12' : '11');
  payload += createField(
    '26',
    createField('00', 'BR.GOV.BCB.PIX') + createField('01', chavePix.trim()),
  );
  payload += createField('52', '0000');
  payload += createField('53', '986');
  if (valor && valor > 0) payload += createField('54', valor.toFixed(2));
  payload += createField('58', 'BR');
  payload += createField('59', textoPix(nomeRecebedor, 25));
  payload += createField('60', textoPix(cidadeRecebedor, 15));
  if (cepRecebedor?.trim()) {
    payload += createField('61', cepRecebedor.replace(/\D/g, '').substring(0, 8));
  }
  payload += createField('62', createField('05', textoPix(txid || '***', 25) || '***'));
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
