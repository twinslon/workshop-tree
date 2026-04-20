function workshopBuyableDisplay(layer, id, label, resource) {
	let amt = getBuyableAmount(layer, id)
	let data = tmp[layer].buyables[id]
	return "Cost: " + format(data.cost) + " " + resource + "<br>" +
		"Owned: " + formatWhole(amt) + "<br>" +
		"Currently: " + format(data.effect) + "x<br><br>" +
		label
}

function spendLayerPoints(layer, amount) {
	player[layer].points = player[layer].points.sub(amount)
	player[layer].spentOnBuyables = player[layer].spentOnBuyables.add(amount)
}

function logisticsBoost(target) {
	if (!player.l || player.l.focus != target) return new Decimal(1)
	let completedContracts = challengeCompletions("b", 11) + challengeCompletions("b", 12)
	return new Decimal(2).add(completedContracts)
}

addLayer("p", {
	name: "parts",
	symbol: "P",
	position: 0,
	startData() { return {
		unlocked: true,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
	}},
	color: "#9aa4ad",
	requires: new Decimal(25),
	resource: "parts",
	baseResource: "scraps",
	baseAmount() { return player.points },
	type: "normal",
	exponent: 0.5,
	gainMult() {
		let mult = new Decimal(1)
		if (hasUpgrade("p", 11)) mult = mult.times(2)
		if (hasUpgrade("p", 14)) mult = mult.times(buyableEffect("p", 11))
		if (hasUpgrade("m", 12)) mult = mult.times(upgradeEffect("m", 12))
		if (player.l && player.l.focus == "parts") mult = mult.times(clickableEffect("l", 12))
		if (player.f && player.f.unlocked) mult = mult.times(layers.f.effect())
		return mult
	},
	gainExp() {
		let exp = new Decimal(1)
		if (hasChallenge("b", 11)) exp = exp.add(0.05)
		return exp
	},
	row: 0,
	effect() {
		return player.p.points.add(1).pow(0.35)
	},
	effectDescription() {
		return "boosting scrap gain by " + format(layers.p.effect()) + "x"
	},
	upgrades: {
		11: {
			title: "Better Tools",
			description: "Double Parts gain.",
			cost: new Decimal(1),
		},
		12: {
			title: "Sorting Bin",
			description: "Parts boost Scrap gain.",
			cost: new Decimal(2),
			effect() { return layers.p.effect() },
			effectDisplay() { return format(upgradeEffect("p", 12)) + "x" },
			unlocked() { return hasUpgrade("p", 11) },
		},
		13: {
			title: "Magnet Arm",
			description: "Double Scrap gain.",
			cost: new Decimal(5),
			unlocked() { return hasUpgrade("p", 12) },
		},
		14: {
			title: "Gear Train",
			description: "Gears multiply Parts gain.",
			cost: new Decimal(12),
			unlocked() { return hasUpgrade("p", 13) },
		},
		15: {
			title: "Assembly Bench",
			description: "Unlock Wires and Plates.",
			cost: new Decimal(25),
			unlocked() { return hasUpgrade("p", 14) },
		},
		21: {
			title: "Measured Cuts",
			description: "Wires boost Gears.",
			cost: new Decimal(60),
			unlocked() { return hasUpgrade("p", 15) },
		},
		22: {
			title: "Standard Screws",
			description: "Plates boost Machines gain.",
			cost: new Decimal(125),
			unlocked() { return hasUpgrade("p", 21) && player.m.unlocked },
		},
	},
	buyables: {
		11: {
			title: "Gears",
			cost(x) { return new Decimal(4).times(new Decimal(1.65).pow(x)) },
			effect(x) {
				let eff = new Decimal(1.35).pow(x)
				if (hasUpgrade("p", 21)) eff = eff.times(buyableEffect("p", 12).sqrt())
				return eff
			},
			display() { return workshopBuyableDisplay(this.layer, this.id, "Multiplies Parts gain.", "parts") },
			canAfford() { return player.p.points.gte(tmp.p.buyables[this.id].cost) },
			buy() {
				let cost = tmp.p.buyables[this.id].cost
				spendLayerPoints("p", cost)
				addBuyables("p", this.id, 1)
			},
			unlocked() { return hasUpgrade("p", 14) },
		},
		12: {
			title: "Wires",
			cost(x) { return new Decimal(20).times(new Decimal(2).pow(x)) },
			effect(x) { return new Decimal(1.25).pow(x) },
			display() { return workshopBuyableDisplay(this.layer, this.id, "Improves Gears once Measured Cuts is bought.", "parts") },
			canAfford() { return player.p.points.gte(tmp.p.buyables[this.id].cost) },
			buy() {
				let cost = tmp.p.buyables[this.id].cost
				spendLayerPoints("p", cost)
				addBuyables("p", this.id, 1)
			},
			unlocked() { return hasUpgrade("p", 15) },
		},
		13: {
			title: "Plates",
			cost(x) { return new Decimal(35).times(new Decimal(2.25).pow(x)) },
			effect(x) { return new Decimal(1.3).pow(x) },
			display() { return workshopBuyableDisplay(this.layer, this.id, "Multiplies Machines gain after Standard Screws.", "parts") },
			canAfford() { return player.p.points.gte(tmp.p.buyables[this.id].cost) },
			buy() {
				let cost = tmp.p.buyables[this.id].cost
				spendLayerPoints("p", cost)
				addBuyables("p", this.id, 1)
			},
			unlocked() { return hasUpgrade("p", 15) },
		},
	},
	doReset(resettingLayer) {
		if (layers[resettingLayer].row <= this.row) return
		let keep = []
		if (hasMilestone("m", 0)) keep.push("upgrades")
		if (hasMilestone("m", 1)) keep.push("buyables", "spentOnBuyables")
		layerDataReset(this.layer, keep)
	},
	hotkeys: [
		{key: "p", description: "P: reset for Parts", onPress(){ if (canReset(this.layer)) doReset(this.layer) }},
	],
	layerShown() { return true },
})

addLayer("m", {
	name: "machines",
	symbol: "M",
	position: 0,
	startData() { return {
		unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
		autoParts: false,
	}},
	color: "#d48b45",
	requires: new Decimal(150),
	resource: "machines",
	baseResource: "parts",
	baseAmount() { return player.p.points },
	type: "normal",
	exponent: 0.45,
	gainMult() {
		let mult = new Decimal(1)
		if (hasUpgrade("p", 22)) mult = mult.times(buyableEffect("p", 13))
		if (hasUpgrade("m", 14)) mult = mult.times(buyableEffect("m", 11))
		if (player.l && player.l.focus == "machines") mult = mult.times(clickableEffect("l", 13))
		if (player.f && player.f.unlocked) mult = mult.times(layers.f.effect())
		return mult
	},
	gainExp() { return new Decimal(1) },
	row: 1,
	effect() {
		return player.m.points.add(1).pow(0.6)
	},
	effectDescription() {
		return "boosting Scrap gain by " + format(layers.m.effect()) + "x"
	},
	upgrades: {
		11: {
			title: "Powered Lathe",
			description: "Machines boost Scrap gain.",
			cost: new Decimal(1),
		},
		12: {
			title: "Parts Hopper",
			description: "Machines boost Parts gain.",
			cost: new Decimal(2),
			effect() { return player.m.points.add(1).pow(0.5) },
			effectDisplay() { return format(upgradeEffect("m", 12)) + "x" },
			unlocked() { return hasUpgrade("m", 11) },
		},
		13: {
			title: "Auto Assembler",
			description: "Gears boost Scrap gain.",
			cost: new Decimal(5),
			effect() { return buyableEffect("p", 11).pow(0.35) },
			effectDisplay() { return format(upgradeEffect("m", 13)) + "x" },
			unlocked() { return hasUpgrade("m", 12) },
		},
		14: {
			title: "Toolheads",
			description: "Unlock Toolhead buyables. They multiply Machines gain.",
			cost: new Decimal(12),
			unlocked() { return hasUpgrade("m", 13) },
		},
	},
	buyables: {
		11: {
			title: "Toolheads",
			cost(x) { return new Decimal(3).times(new Decimal(1.8).pow(x)) },
			effect(x) { return new Decimal(1.4).pow(x) },
			display() { return workshopBuyableDisplay(this.layer, this.id, "Multiplies Machines gain.", "machines") },
			canAfford() { return player.m.points.gte(tmp.m.buyables[this.id].cost) },
			buy() {
				let cost = tmp.m.buyables[this.id].cost
				spendLayerPoints("m", cost)
				addBuyables("m", this.id, 1)
			},
			unlocked() { return hasUpgrade("m", 14) },
		},
	},
	milestones: {
		0: {
			requirementDescription: "1 total Machine",
			effectDescription: "Keep Parts upgrades on Machine and higher resets.",
			done() { return player.m.total.gte(1) },
		},
		1: {
			requirementDescription: "5 total Machines",
			effectDescription: "Keep Parts buyables on Machine and higher resets.",
			done() { return player.m.total.gte(5) },
		},
		2: {
			requirementDescription: "15 total Machines",
			effectDescription: "Unlock Logistics routing.",
			done() { return player.m.total.gte(15) },
		},
	},
	doReset(resettingLayer) {
		if (layers[resettingLayer].row <= this.row) return
		let keep = ["milestones"]
		if (hasMilestone("b", 0)) keep.push("upgrades")
		layerDataReset(this.layer, keep)
	},
	hotkeys: [
		{key: "m", description: "M: reset for Machines", onPress(){ if (canReset(this.layer)) doReset(this.layer) }},
	],
	layerShown() { return player.p.best.gte(100) || player.m.unlocked },
})

addLayer("l", {
	name: "logistics",
	symbol: "L",
	position: 0,
	startData() { return {
		unlocked: true,
		points: new Decimal(0),
		focus: "scraps",
	}},
	color: "#4aa3a2",
	resource: "routes",
	row: "side",
	type: "none",
	clickables: {
		11: {
			title: "Scrap Route",
			display() { return "Send carts to Scrap collection.<br>Boost: " + format(clickableEffect("l", 11)) + "x" },
			effect() { return logisticsBoost("scraps") },
			canClick() { return player.l.focus != "scraps" },
			onClick() { player.l.focus = "scraps" },
			style() { return player.l.focus == "scraps" ? {"background-color": "#4aa3a2"} : {} },
		},
		12: {
			title: "Parts Route",
			display() { return "Send carts to Parts sorting.<br>Boost: " + format(clickableEffect("l", 12)) + "x" },
			effect() { return logisticsBoost("parts") },
			canClick() { return player.l.focus != "parts" },
			onClick() { player.l.focus = "parts" },
			style() { return player.l.focus == "parts" ? {"background-color": "#4aa3a2"} : {} },
		},
		13: {
			title: "Machine Route",
			display() { return "Send carts to Machine workstations.<br>Boost: " + format(clickableEffect("l", 13)) + "x" },
			effect() { return logisticsBoost("machines") },
			canClick() { return player.l.focus != "machines" },
			onClick() { player.l.focus = "machines" },
			style() { return player.l.focus == "machines" ? {"background-color": "#4aa3a2"} : {} },
		},
	},
	tabFormat: [
		"main-display",
		["display-text", "Choose one workflow to prioritize. Contract completions make routing stronger."],
		"blank",
		["clickables", [1, 2, 3]],
	],
	layerShown() { return hasMilestone("m", 2) || player.b.unlocked },
})

addLayer("b", {
	name: "blueprints",
	symbol: "B",
	position: 0,
	startData() { return {
		unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
	}},
	color: "#4c78c4",
	requires: new Decimal(25),
	resource: "blueprints",
	baseResource: "machines",
	baseAmount() { return player.m.points },
	type: "normal",
	exponent: 0.4,
	gainMult() {
		let mult = new Decimal(1)
		if (hasUpgrade("b", 11)) mult = mult.times(2)
		if (player.f && player.f.unlocked) mult = mult.times(layers.f.effect())
		return mult
	},
	gainExp() { return new Decimal(1) },
	row: 2,
	upgrades: {
		11: {
			title: "Clean Drafting",
			description: "Double Blueprint gain.",
			cost: new Decimal(1),
		},
		12: {
			title: "Shop Standards",
			description: "Blueprints boost Scrap gain.",
			cost: new Decimal(3),
			effect() { return player.b.points.add(1).pow(0.7) },
			effectDisplay() { return format(upgradeEffect("b", 12)) + "x" },
			unlocked() { return hasUpgrade("b", 11) },
		},
		13: {
			title: "Reusable Plans",
			description: "Keep Machine upgrades on Blueprint and higher resets.",
			cost: new Decimal(8),
			unlocked() { return hasUpgrade("b", 12) },
		},
	},
	milestones: {
		0: {
			requirementDescription: "1 total Blueprint",
			effectDescription: "Keep Machine upgrades on Blueprint and higher resets.",
			done() { return player.b.total.gte(1) || hasUpgrade("b", 13) },
		},
	},
	challenges: {
		11: {
			name: "Scrap Shortage",
			challengeDescription: "Scrap gain is divided by 10.",
			goalDescription: "Reach 1,000 Parts.",
			canComplete() { return player.p.points.gte(1000) },
			rewardDescription: "Parts gain exponent is increased.",
			completionLimit: 1,
			unlocked() { return player.b.best.gte(1) },
		},
		12: {
			name: "Manual Shift",
			challengeDescription: "Machine effects are disabled.",
			goalDescription: "Reach 10 Machines.",
			canComplete() { return player.m.points.gte(10) },
			rewardDescription: "Logistics routes are stronger.",
			completionLimit: 1,
			unlocked() { return hasChallenge("b", 11) },
		},
	},
	doReset(resettingLayer) {
		if (layers[resettingLayer].row <= this.row) return
		layerDataReset(this.layer, ["milestones", "challenges"])
	},
	hotkeys: [
		{key: "b", description: "B: reset for Blueprints", onPress(){ if (canReset(this.layer)) doReset(this.layer) }},
	],
	layerShown() { return player.m.best.gte(15) || player.b.unlocked },
})

addLayer("f", {
	name: "factories",
	symbol: "F",
	position: 0,
	startData() { return {
		unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
	}},
	color: "#3f7f55",
	requires: new Decimal(10),
	resource: "factories",
	baseResource: "blueprints",
	baseAmount() { return player.b.points },
	type: "static",
	base: 2,
	exponent: 1.25,
	canBuyMax() { return hasMilestone("f", 1) },
	gainMult() { return new Decimal(1) },
	gainExp() { return new Decimal(1) },
	row: 3,
	effect() {
		return new Decimal(3).pow(player.f.points)
	},
	effectDescription() {
		return "multiplying Scrap, Parts, Machines, and Blueprints by " + format(layers.f.effect()) + "x"
	},
	milestones: {
		0: {
			requirementDescription: "1 Factory",
			effectDescription: "Factories boost every main production chain.",
			done() { return player.f.points.gte(1) },
		},
		1: {
			requirementDescription: "3 Factories",
			effectDescription: "You can buy max Factories.",
			done() { return player.f.points.gte(3) },
		},
	},
	hotkeys: [
		{key: "f", description: "F: reset for Factories", onPress(){ if (canReset(this.layer)) doReset(this.layer) }},
	],
	layerShown() { return player.b.best.gte(8) || player.f.unlocked },
})
