export default {
    algorithmParams: {
        procreationProbabilities: [0.9, 0.75, 0.25, 0.1],
        crossoverProbability: 0.75,
        mutationRate: 0.01
    },

    defaultProblem: {
        items: [
            3, 7, 12, 19, 23, 29, 35, 41, 47, 53,
            61, 67, 71, 79, 83, 89, 97, 101, 109, 113,
            127, 131, 137, 149, 151, 157, 163, 173, 179, 181,
            191, 199, 211, 223, 227, 233, 239, 251, 257, 263
        ],
        targetWeight: 1500,
    }
} 