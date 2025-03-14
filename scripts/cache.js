import { unwrapCurrentPlayerYields } from "./effects/yields.js";

export const PolicyYieldsCache = new class {
    /** @type {UnwrappedPlayerYields} */
    _yields = {};
    /** @type {Record<string, Set<string>>} */
    _typeTags = {};
    /** @type {Map<number, number>} */
    _cityTradeYields = new Map();

    _localeTradeYieldDescription = Locale.compose("LOC_ATTR_YIELD_FROM_TRADE");

    update() {
        this._yields = unwrapCurrentPlayerYields();
        // TODO Remove log
        // console.warn("UnwrappedPlayerYieldsCache updated", JSON.stringify(this._yields));
    }

    cleanup() {
        this._yields = {};
        this._typeTags = {};
    }

    /** @returns {UnwrappedPlayerYields} */
    getYields() {
        return this._yields;
    }

    getYieldsForType(yieldType) {
        return this._yields[yieldType];
    }

    /**
     * @param {string} type 
     * @returns {Set<string>}
     */
    getTypeTags(type) {
        if (!this._typeTags[type]) {
            const tags = GameInfo.TypeTags
                .filter(tag => tag.Type === type)
                .map(tag => tag.Tag);

            this._typeTags[type] = new Set(tags);
        }

        return this._typeTags[type];
    }

    /**
     * Check if the  type has the tag assigned
     * @param {string} type
     * @param {string} tag
     */
    hasTypeTag(type, tag) {
        return this.getTypeTags(type).has(tag);
    }

    /**
     * Since `city.Yields.getTradeYield` seems to be broken, we need to calculate it manually
     * @param {City} city
     */
    getCityTradeYields(city) {
        if (!this._cityTradeYields.has(city.id.id)) {
            if (!city.Yields) return null;
            const yields = city.Yields.getYieldsForType("YIELD_GOLD");
            if (!yields) return null;

            let tradeYield = 0;
            iterateYieldSteps(yields, step => {
                if (step.description === "LOC_ATTR_YIELD_FROM_TRADE" || step.description === this._localeTradeYieldDescription) {
                    tradeYield += step.value;
                }
            });
            this._cityTradeYields.set(city.id.id, tradeYield);
        }

        return this._cityTradeYields.get(city.id.id);
    }
}

/**
 * We don't want to expose the cache directly, so this method is not exported
 * @param {YieldEntry | YieldStep} entry
 * @param {(entry:YieldStep | YieldEntry) => void} callback
 */
function iterateYieldSteps(entry, callback) {
    let queue = [entry];
    while (queue.length) {
        const current = queue.shift();
        if (!current) continue;
 
        callback(current);
        if (current.base) queue.push(current.base);
        if (current.modifier) queue.push(current.modifier);
        if ('steps' in current) {
            queue.push(...current.steps || []);
        }
    }
 }