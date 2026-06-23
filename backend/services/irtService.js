/**
 * Item Response Theory (IRT) Service
 * Using a basic 1PL/2PL model logic for adaptive testing
 */

/**
 * Get adaptive difficulty for the next question
 * @param {number} theta - Current ability level (-3 to 3)
 */
exports.getAdaptiveDifficulty = (theta, previousSuccess, questionCount) => {
    // Map theta (-3 to 3) to difficulty (0.1 to 0.9)
    // Logistic function: 1 / (1 + exp(-theta))
    const baseDifficulty = 1 / (1 + Math.exp(-theta));

    // Add some randomness/exploration
    const jitter = (Math.random() - 0.5) * 0.1;
    return Math.max(0.1, Math.min(0.9, baseDifficulty + jitter));
};

/**
 * Estimate student ability (Theta) based on responses
 * Simplified Bayesian update or MLE
 */
exports.estimateAbility = (responses, questions, currentTheta) => {
    if (responses.length === 0) return currentTheta;

    // Simple heuristic: increase theta for correct, decrease for incorrect
    // Magnitude depends on the gap between theta and question difficulty
    let newTheta = currentTheta;

    for (let i = 0; i < responses.length; i++) {
        const isCorrect = responses[i];
        const question = questions[i];

        if (!question) continue;

        let difficulty = question.difficulty || 0.5;
        difficulty = Math.max(0.01, Math.min(0.99, difficulty));

        // Convert difficulty back to theta space
        const targetTheta = -Math.log(1 / difficulty - 1);

        const learningRate = 0.5 / (1 + i * 0.1); // Decay learning rate

        if (isCorrect) {
            newTheta += learningRate * (1 - (1 / (1 + Math.exp(-(newTheta - targetTheta)))));
        } else {
            newTheta -= learningRate * (1 / (1 + Math.exp(-(newTheta - targetTheta))));
        }
    }

    return Math.max(-3, Math.min(3, newTheta));
};

/**
 * Convert Theta (-3 to 3) to Percentage (0 to 100)
 */
exports.thetaToPercentage = (theta) => {
    // Sigmoid mapping
    const percentage = (1 / (1 + Math.exp(-theta))) * 100;
    return Math.round(percentage);
};
