export default function toUnixTimestamps(timestamp: number): number {
  return Math.floor(timestamp / 1000);
}
