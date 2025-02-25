
/**
 * Creates an empty yields object.
 * @returns {YieldsDelta}
 */
export function createEmptyYieldsDelta() {
    return {
        Amount: {},
        Percent: {},
        AmountNoMultiplier: {},
    };
}

/**
 * Add an amount to the yields.
 * @param {YieldsDelta} yieldsDelta 
 * @param {ResolvedModifier} modifier 
 * @param {number} amount 
 */
export function addYieldsAmount(yieldsDelta, modifier, amount) {
    if (typeof modifier.Arguments?.YieldType?.Value === "undefined") {
        console.error(`Modifier ${modifier.Modifier.ModifierId} is missing a YieldType argument.`, modifier.Arguments);
        return;
    }   

    const percentMultiplier = modifier.Arguments.PercentMultiplier?.Value === "true";
    
    parseYieldsType(modifier.Arguments.YieldType.Value).forEach(type => {
        const key = percentMultiplier ? "AmountNoMultiplier" : "Amount";
        if (!yieldsDelta[key][type]) {
            yieldsDelta[key][type] = 0;
        }
        yieldsDelta[key][type] += amount;
    });
}

/**
 * Add a percentage to the yields.
 * @param {YieldsDelta} yieldsDelta
 * @param {ResolvedModifier} modifier
 * @param {number} percent
 */
export function addYieldsPercent(yieldsDelta, modifier, percent) {
    if (typeof modifier.Arguments?.YieldType?.Value === "undefined") {
        console.error(`Modifier ${modifier.Modifier.ModifierId} is missing a YieldType argument.`, modifier.Arguments);
        return;
    }   

    parseYieldsType(modifier.Arguments.YieldType.Value).forEach(type => {
        if (!yieldsDelta.Percent[type]) {
            yieldsDelta.Percent[type] = 0;
        }
        yieldsDelta[type] += percent;
    });
}

/**
 * E.g. "YIELD_FOOD, YIELD_PRODUCTION"
 * @param {string} yieldsType
 * @returns {string[]}
 */
function parseYieldsType(yieldsType) {
    return yieldsType.split(",").map(type => type.trim());
}

/**
 * @param {YieldsDelta} yieldsDelta 
 */
export function resolveYields(player, yieldsDelta) {
    const yields = {};

    for (const type in YieldTypes) {
        yields[type] = yieldsDelta.Amount[type] || 0;
    }

    for (const type in yieldsDelta.Percent) {
        const netYield = player.Stats.getNetYield(type);
        const increase = (netYield + yieldsDelta.Amount[type] || 0) * (yieldsDelta.Percent[type] / 100);
        yields[type] = yields[type] + increase;
    }

    // TODO This is probably wrong, since even the previous net yield is probably
    // already including some multiplied / non-multiplied yields.
    for (const type in yieldsDelta.AmountNoMultiplier) {
        yields[type] = yields[type] + yieldsDelta.AmountNoMultiplier[type];
    }

    return yields;
}