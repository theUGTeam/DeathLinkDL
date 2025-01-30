import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();

    const scoreMap = {};
    const errs = [];
    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        // Multiple Verifiers
        const verifiers = Array.isArray(level.verifier) ? level.verifier : [level.verifier];
        verifiers.forEach(verifier => {
            scoreMap[verifier] ??= { verified: [], completed: [], progressed: [] };
            scoreMap[verifier].verified.push({
                rank: rank + 1,
                level: level.name,
                score: score(rank + 1, 100, level.percentToQualify) / verifiers.length,
                links: Array.isArray(level.verification) ? level.verification : [level.verification],
            });
        });

        // Records with Multiple Players
        level.records.forEach((record) => {
            const users = Array.isArray(record.user) ? record.user : [record.user];
            users.forEach(user => {
                scoreMap[user] ??= { verified: [], completed: [], progressed: [] };
                const { completed, progressed } = scoreMap[user];
                
                if (record.percent === 100) {
                    completed.push({
                        rank: rank + 1,
                        level: level.name,
                        score: score(rank + 1, 100, level.percentToQualify) / users.length,
                        links: Array.isArray(record.link) ? record.link : [record.link],
                    });
                    return;
                }

                progressed.push({
                    rank: rank + 1,
                    level: level.name,
                    percent: record.percent,
                    score: score(rank + 1, record.percent, level.percentToQualify) / users.length,
                    links: Array.isArray(record.link) ? record.link : [record.link],
                });
            });
        });
    });

    // Wrap in extra Object containing the user and total score
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    // Sort by total score
    return [res.sort((a, b) => b.total - a.total), errs];
}
