import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchList, fetchLeaderboard } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <select v-model="selectedPage" @change="updateView">
                    <option value="list">List</option>
                    <option value="leaderboard">Leaderboard</option>
                    <option value="info">Information</option>
                </select>
                <div v-if="selectedPage === 'list'">
                    <table class="list" v-if="list">
                        <tr v-for="([level, err], i) in list">
                            <td class="rank">
                                <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                                <p v-else class="type-label-lg">Legacy</p>
                            </td>
                            <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ level?.name || ('Error (' + err + '.json)') }}</span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-if="selectedPage === 'leaderboard'">
                    <h2>Leaderboard</h2>
                    <p>Leaderboard data will be displayed here.</p>
                </div>
                <div v-if="selectedPage === 'info'">
                    <h2>Submission Requirements</h2>
                    <p>
                        Achieved the record without using hacks (however, FPS bypass is allowed, up to 360fps)
                    </p>
                    <p>
                        Achieved the record on the level that is listed on the site - please check the level ID before you submit a record
                    </p>
                    <p>
                        Have either source audio or clicks/taps in the video. Edited audio only does not count
                    </p>
                    <p>
                        The recording must have a previous attempt and entire death animation shown before the completion, unless the completion is on the first attempt. Everyplay records are exempt from this
                    </p>
                    <p>
                        The recording must also show the player hit the endwall, or the completion will be invalidated.
                    </p>
                    <p>
                        Do not use secret routes or bug routes
                    </p>
                    <p>
                        Do not use easy modes, only a record of the unmodified level qualifies
                    </p>
                    <p>
                        Once a level falls onto the Legacy List, we accept records for it for 24 hours after it falls off, then afterwards we never accept records for said level
                    </p>
                </div>
            </div>
            <div v-if="selectedPage === 'list' && level" class="level-container">
                <div class="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="Array.isArray(level.verifier) ? level.verifier.join(', ') : level.verifier"></LevelAuthors>
                    <div v-for="vid in video" :key="vid">
                        <iframe :src="vid" frameborder="0" width="552" height="320" allowfullscreen></iframe>
                    </div>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        selectedPage: 'list',
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store
    }),
    computed: {
        level() {
            return this.list[this.selected][0];
        },
        video() {
            return Array.isArray(this.level.verification)
                ? this.level.verification.map(embed)
                : [embed(this.level.verification)];
        },
    },
    async mounted() {
        this.list = await fetchList();
        this.loading = false;
    },
    methods: {
        embed,
        score,
        updateView() {
            this.selected = 0;
        }
    },
};
