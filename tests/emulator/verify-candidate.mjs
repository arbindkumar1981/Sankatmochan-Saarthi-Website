import {pathToFileURL} from 'node:url';

export function verifiedCandidate(value) {
  if (typeof value !== 'string' || value !== value.trim() || !/^https:\/\/saarthi-candidate-[a-f0-9]{12}---[a-z0-9-]+(?:\.[a-z0-9-]+)*\.run\.app\/?$/.test(value)) {
    throw new Error('Set the reviewed SAARTHI_VERIFIED_CANDIDATE_URL repository variable before release.');
  }
  return value;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifiedCandidate(process.env.CANDIDATE_URL);
  console.log('PASS: candidate URL syntax; independent runtime verification remains required.');
}
