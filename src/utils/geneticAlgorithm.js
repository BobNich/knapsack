/**
 * Genetic Algorithm for Knapsack Problem
 * Based on the research paper
 */

// Helper function to calculate total weight of items in a chromosome
const calculateWeight = (chromosome, items) => {
    return chromosome.reduce((sum, bit, index) => {
        // Support both new structure with item.value and old structure with direct values
        const itemValue = items[index].value !== undefined ? items[index].value : items[index];
        return sum + bit * itemValue;
    }, 0);
};

// Calculate fitness value (absolute difference between weight and target)
const calculateFitness = (chromosome, items, targetWeight) => {
    const weight = calculateWeight(chromosome, items);
    return Math.abs(weight - targetWeight);
};

// Generate initial random population
const generateInitialPopulation = (popSize, chromosomeLength) => {
    const population = [];
    for (let i = 0; i < popSize; i++) {
        const chromosome = [];
        for (let j = 0; j < chromosomeLength; j++) {
            chromosome.push(Math.random() > 0.5 ? 1 : 0);
        }
        population.push({
            chromosome,
            fitness: 0 // Will be calculated later
        });
    }
    return population;
};

// Evaluate fitness for entire population
const evaluatePopulation = (population, items, targetWeight) => {
    return population.map(individual => {
        const fitness = calculateFitness(individual.chromosome, items, targetWeight);
        return {...individual, fitness};
    });
};

// Select parents for next generation using the "roulette wheel" selection technique
const selectParents = (population, procreationProbabilities) => {
    // Calculate fitness statistics
    let fitnessValues = population.map(individual => individual.fitness);
    const minFitness = Math.min(...fitnessValues);
    const maxFitness = Math.max(...fitnessValues);
    const avgFitness = fitnessValues.reduce((a, b) => a + b, 0) / fitnessValues.length;
    const midFitness = avgFitness + (maxFitness - avgFitness) / 2;

    // Set thresholds
    const fitnessThresholds = [
        minFitness + (avgFitness - minFitness) * 0.5, // Middle between min and avg
        avgFitness,
        midFitness,
        maxFitness
    ];

    // Scan population for selection
    const winners = [];
    let i = 0;

    while (winners.length < population.length) {
        // Wrap around if we reach the end
        if (i >= population.length) {
            i = 0;
        }

        const individual = population[i];
        let sectionIndex;

        // Determine which section this individual belongs to
        if (individual.fitness <= fitnessThresholds[0]) {
            sectionIndex = 0;
        } else if (individual.fitness <= fitnessThresholds[1]) {
            sectionIndex = 1;
        } else if (individual.fitness <= fitnessThresholds[2]) {
            sectionIndex = 2;
        } else {
            sectionIndex = 3;
        }

        // Roll the die
        if (Math.random() < procreationProbabilities[sectionIndex]) {
            winners.push(individual);
        }

        i++;
    }

    return winners;
};

// Perform crossover
const crossover = (parent1, parent2, crossoverProbability) => {
    if (Math.random() > crossoverProbability) {
        // Just replicate
        return [{...parent1}, {...parent2}];
    }

    // Choose crossover point
    const crossoverPoint = Math.floor(Math.random() * (parent1.chromosome.length - 1)) + 1;

    // Create new chromosomes
    const child1Chromosome = [
        ...parent1.chromosome.slice(0, crossoverPoint),
        ...parent2.chromosome.slice(crossoverPoint)
    ];

    const child2Chromosome = [
        ...parent2.chromosome.slice(0, crossoverPoint),
        ...parent1.chromosome.slice(crossoverPoint)
    ];

    return [
        {chromosome: child1Chromosome, fitness: 0},
        {chromosome: child2Chromosome, fitness: 0}
    ];
};

// Perform mutations
const mutate = (population, mutationRate) => {
    const geneCount = population.length * population[0].chromosome.length;
    const mutationCount = Math.round(geneCount * mutationRate);

    for (let i = 0; i < mutationCount; i++) {
        const individualIndex = Math.floor(Math.random() * population.length);
        const geneIndex = Math.floor(Math.random() * population[0].chromosome.length);

        // Flip the bit
        population[individualIndex].chromosome[geneIndex] =
            population[individualIndex].chromosome[geneIndex] === 0 ? 1 : 0;
    }

    return population;
};

// Create a new generation
const createNewGeneration = (population, procreationProbabilities, crossoverProbability, mutationRate) => {
    // Select parents
    const parents = selectParents(population, procreationProbabilities);

    // Create new population through crossover
    const newPopulation = [];
    for (let i = 0; i < parents.length; i += 2) {
        if (i + 1 < parents.length) {
            const children = crossover(parents[i], parents[i + 1], crossoverProbability);
            newPopulation.push(...children);

            // Break if we have enough new individuals
            if (newPopulation.length >= population.length) {
                break;
            }
        } else {
            newPopulation.push({...parents[i]});
        }
    }

    // Trim if necessary
    const finalPopulation = newPopulation.slice(0, population.length);

    // Apply mutations
    return mutate(finalPopulation, mutationRate);
};

// Main genetic algorithm function
export const runGeneticAlgorithm = (
    items,
    targetWeight,
    populationSize = 100,
    generations = 100,
    procreationProbabilities = [0.9, 0.75, 0.25, 0.1],
    crossoverProbability = 0.75,
    mutationRate = 0.01,
    onGenerationComplete = null
) => {
    // Normalize items to ensure they all have the correct structure
    const normalizedItems = items.map(item => {
        if (typeof item.value !== 'undefined') {
            return item;
        } else {
            return { id: Date.now() + Math.random(), value: item };
        }
    });
    
    // Initialize
    let population = generateInitialPopulation(populationSize, normalizedItems.length);
    population = evaluatePopulation(population, normalizedItems, targetWeight);

    const history = [];
    const populations = []; // Store populations for each generation
    let bestSolution = null;

    // Save initial population
    populations.push(JSON.parse(JSON.stringify(population)));

    // Main loop
    for (let generation = 0; generation < generations; generation++) {
        // Find best solution in current population
        population.sort((a, b) => a.fitness - b.fitness);
        const generationBest = population[0];

        // Update overall best solution
        if (!bestSolution || generationBest.fitness < bestSolution.fitness) {
            bestSolution = {...generationBest, generation};
        }

        // Generate history entry for this generation
        const historyEntry = {
            generation,
            averageFitness: population.reduce((sum, ind) => sum + ind.fitness, 0) / populationSize,
            bestFitness: generationBest.fitness,
            bestChromosome: [...generationBest.chromosome],
            bestWeight: calculateWeight(generationBest.chromosome, normalizedItems)
        };
        
        // Add to history
        history.push(historyEntry);

        // Call the callback if provided - note this happens before changing the population
        if (onGenerationComplete) {
            // Make a deep copy of the population to avoid reference issues
            const populationCopy = JSON.parse(JSON.stringify(population));
            onGenerationComplete(historyEntry, populationCopy);
        }

        // Check if we found a perfect solution (fitness = 0)
        if (generationBest.fitness === 0) {
            // Add the final population to the populations array
            populations.push(JSON.parse(JSON.stringify(population)));
            break;
        }

        // Create new generation
        population = createNewGeneration(
            population,
            procreationProbabilities,
            crossoverProbability,
            mutationRate
        );

        // Evaluate new population
        population = evaluatePopulation(population, normalizedItems, targetWeight);
        
        // Save current population (after changes) for next generation
        if (generation < generations - 1) {
            populations.push(JSON.parse(JSON.stringify(population)));
        }
    }

    return {
        solution: bestSolution,
        history,
        populations, // Return population history
        foundExactSolution: bestSolution?.fitness === 0
    };
};
