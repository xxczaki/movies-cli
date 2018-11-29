#!/usr/bin/env node

'use strict';

const meow = require('meow');
const prompts = require('prompts');
const graphqlGot = require('graphql-got');
const chalk = require('chalk');
const isReachable = require('is-reachable');

meow(`
	$ movie
`);

isReachable('https://movie-database-graphql-qwqnwstigc.now.sh/').then(async reachable => {
	if (reachable === true) {
		// Ask user about the title of the movie
		const prompt = await prompts({
			type: 'text',
			name: 'title',
			message: 'Type a movie title:'
		});

		// Form a search query
		const query = `{
		movies(query: "${prompt.title}") {
			title
			overview
			release_date
			id
		}
	}`;

		try {
		// Connect with the GraphQL server
			graphqlGot('https://movie-database-graphql-qwqnwstigc.now.sh/graphql', {query}).then(async response => {
			// If no movies found, exit
				if (Object.keys(response.body.movies).length === 0) {
					console.log(chalk.red('No movies found!'));
					process.exit(1);
				}

				// If there is only one movie, skip showing the list and display info
				if (Object.keys(response.body.movies).length === 1) {
					const parsed = parseInt(response.body.movies.map(v => v.id), 10);
					const data = response.body.movies.find(v => v.id === parsed);

					// If overview is empty, show N/A instead
					const isOverview = () => {
						if (data.overview === '') {
							return `${chalk.cyan('Overview:')} N/A`;
						}
						return `${chalk.cyan('Overview:')} ${data.overview}`;
					};

					// Show user info about selected movie
					console.log(`\n${chalk.bold.green(data.title)}\n\n${chalk.cyan('Release Date:')} ${data.release_date}\n${isOverview()}`);
					process.exit(0);
				}

				// Show only the first five movies if posibble
				const list = () => {
					if (Object.keys(response.body.movies).length < 5) {
						return response.body.movies.map(v => ({title: v.title, value: v.id}));
					}
					return response.body.movies.map(v => ({title: v.title, value: v.id})).slice(0, 5);
				};

				// Show a list of available movies
				const prompt = await prompts({
					type: 'select',
					name: 'choice',
					message: 'I found these movies:',
					choices: list(),
					initial: 1
				});

				// Find a selected movie by it's ID
				const parsedId = parseInt(prompt.choice, 10);
				const data = response.body.movies.find(v => v.id === parsedId);

				// If overview is empty, don't show it
				const isOverview = () => {
					if (data.overview === '') {
						return `${chalk.cyan('Overview:')} N/A`;
					}
					return `${chalk.cyan('Overview:')} ${data.overview}`;
				};

				// Show user info about selected movie
				console.log(`\n${chalk.bold.green(data.title)}\n\n${chalk.cyan('Release Date:')} ${data.release_date}\n${isOverview()}`);
			});
		} catch (error) {
			console.log(chalk.red(error));
			process.exit(1);
		}
	} else {
		console.log(chalk.red('Failed connecting to server! Check your internet connection and try again.'));
	}
});
