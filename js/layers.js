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

function buyMaxWorkshopBuyable(layer, id) {
	let guard = 0
	while (canBuyBuyable(layer, id) && guard < 1000) {
		run(layers[layer].buyables[id].buy, layers[layer].buyables[id])
		updateBuyableTemp(layer)
		guard++
	}
}

function logisticsBoost(target) {
	if (!player.l || player.l.focus != target) return new Decimal(1)
	if (inChallenge("b", 22)) return new Decimal(1)
	let completedContracts = challengeCompletions("b", 11) + challengeCompletions("b", 12)
		+ challengeCompletions("b", 21) + challengeCompletions("b", 22)
	let boost = new Decimal(2).add(completedContracts)
	if (player.f && player.f.unlocked) boost = boost.add(player.f.points)
	if (player.w && player.w.unlocked) boost = boost.add(player.w.points)
	return boost
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
		if (hasUpgrade("p", 25)) mult = mult.times(player.m.points.add(1).pow(0.25))
		if (hasUpgrade("m", 12)) mult = mult.times(upgradeEffect("m", 12))
		if (player.l && player.l.focus == "parts") mult = mult.times(clickableEffect("l", 12))
		if (player.f && player.f.unlocked) mult = mult.times(layers.f.effect())
		if (player.w && player.w.unlocked) mult = mult.times(layers.w.effect())
		if (player.r && player.r.unlocked) mult = mult.times(layers.r.effect())
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
		23: {
			title: "Bulk Bins",
			description: "Unlock bulk buying for Parts buyables.",
			cost: new Decimal(250),
			unlocked() { return hasUpgrade("p", 22) },
		},
		24: {
			title: "Scrap Press",
			description: "Wires boost Scrap gain.",
			cost: new Decimal(400),
			effect() { return buyableEffect("p", 12).pow(0.75) },
			effectDisplay() { return format(upgradeEffect("p", 24)) + "x" },
			unlocked() { return hasUpgrade("p", 23) },
		},
		25: {
			title: "Machine Gauges",
			description: "Machines add a small boost to Parts gain.",
			cost: new Decimal(750),
			unlocked() { return hasUpgrade("p", 24) && player.m.unlocked },
		},
	},
	buyables: {
		11: {
			title: "Gears",
			cost(x) { return new Decimal(4).times(new Decimal(1.65).pow(x)) },
			effect(x) {
				let eff = new Decimal(1.35).pow(x)
				if (hasUpgrade("p", 21)) eff = eff.times(buyableEffect("p", 12).sqrt())
				if (inChallenge("b", 21)) eff = eff.sqrt()
				return eff
			},
			display() { return workshopBuyableDisplay(this.layer, this.id, "Multiplies Parts gain.", "parts") },
			canAfford() { return player.p.points.gte(tmp.p.buyables[this.id].cost) },
			buy() {
				let cost = tmp.p.buyables[this.id].cost
				spendLayerPoints("p", cost)
				addBuyables("p", this.id, 1)
			},
			buyMax() { if (hasUpgrade("p", 23)) buyMaxWorkshopBuyable(this.layer, this.id) },
			unlocked() { return hasUpgrade("p", 14) },
		},
		12: {
			title: "Wires",
			cost(x) { return new Decimal(20).times(new Decimal(2).pow(x)) },
			effect(x) {
				let eff = new Decimal(1.25).pow(x)
				if (inChallenge("b", 21)) eff = eff.sqrt()
				return eff
			},
			display() { return workshopBuyableDisplay(this.layer, this.id, "Improves Gears once Measured Cuts is bought.", "parts") },
			canAfford() { return player.p.points.gte(tmp.p.buyables[this.id].cost) },
			buy() {
				let cost = tmp.p.buyables[this.id].cost
				spendLayerPoints("p", cost)
				addBuyables("p", this.id, 1)
			},
			buyMax() { if (hasUpgrade("p", 23)) buyMaxWorkshopBuyable(this.layer, this.id) },
			unlocked() { return hasUpgrade("p", 15) },
		},
		13: {
			title: "Plates",
			cost(x) { return new Decimal(35).times(new Decimal(2.25).pow(x)) },
			effect(x) {
				let eff = new Decimal(1.3).pow(x)
				if (inChallenge("b", 21)) eff = eff.sqrt()
				return eff
			},
			display() { return workshopBuyableDisplay(this.layer, this.id, "Multiplies Machines gain after Standard Screws.", "parts") },
			canAfford() { return player.p.points.gte(tmp.p.buyables[this.id].cost) },
			buy() {
				let cost = tmp.p.buyables[this.id].cost
				spendLayerPoints("p", cost)
				addBuyables("p", this.id, 1)
			},
			buyMax() { if (hasUpgrade("p", 23)) buyMaxWorkshopBuyable(this.layer, this.id) },
			unlocked() { return hasUpgrade("p", 15) },
		},
	},
	passiveGeneration() {
		if (hasUpgrade("m", 25)) return 0.35
		if (hasUpgrade("m", 24)) return 0.1
		return 0
	},
	autoPrestige() {
		return false
	},
	autoUpgrade() {
		return hasUpgrade("m", 23)
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
		if (hasUpgrade("m", 21)) mult = mult.times(buyableEffect("m", 12))
		if (hasUpgrade("b", 14)) mult = mult.times(upgradeEffect("b", 14))
		if (hasUpgrade("f", 11)) mult = mult.times(upgradeEffect("f", 11))
		if (player.l && player.l.focus == "machines") mult = mult.times(clickableEffect("l", 13))
		if (player.f && player.f.unlocked) mult = mult.times(layers.f.effect())
		if (player.w && player.w.unlocked) mult = mult.times(layers.w.effect())
		if (player.r && player.r.unlocked) mult = mult.times(layers.r.effect())
		return mult
	},
	gainExp() { return new Decimal(1) },
	row: 1,
	effect() {
		if (inChallenge("b", 12)) return new Decimal(1)
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
		21: {
			title: "Conveyor Belts",
			description: "Unlock Conveyor buyables. They multiply Machines gain.",
			cost: new Decimal(25),
			unlocked() { return hasUpgrade("m", 14) && hasMilestone("m", 3) },
		},
		22: {
			title: "Preventive Maintenance",
			description: "Toolheads boost Blueprint gain.",
			cost: new Decimal(50),
			unlocked() { return hasUpgrade("m", 21) },
		},
		23: {
			title: "Service Manuals",
			description: "Automatically buy Parts upgrades.",
			cost: new Decimal(100),
			unlocked() { return hasUpgrade("m", 22) },
		},
		24: {
			title: "Feeder Lines",
			description: "Passively generate 10% of your Parts reset gain each second.",
			cost: new Decimal(200),
			unlocked() { return hasUpgrade("m", 23) },
		},
		25: {
			title: "Night Shift",
			description: "Increase passive Parts generation to 35% of your reset gain each second.",
			cost: new Decimal(400),
			unlocked() { return hasUpgrade("m", 24) },
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
			buyMax() { if (hasMilestone("b", 1)) buyMaxWorkshopBuyable(this.layer, this.id) },
			unlocked() { return hasUpgrade("m", 14) },
		},
		12: {
			title: "Conveyors",
			cost(x) { return new Decimal(10).times(new Decimal(2.1).pow(x)) },
			effect(x) { return new Decimal(1.32).pow(x) },
			display() { return workshopBuyableDisplay(this.layer, this.id, "Multiplies Machines gain after Conveyor Belts.", "machines") },
			canAfford() { return player.m.points.gte(tmp.m.buyables[this.id].cost) },
			buy() {
				let cost = tmp.m.buyables[this.id].cost
				spendLayerPoints("m", cost)
				addBuyables("m", this.id, 1)
			},
			buyMax() { if (hasMilestone("b", 1)) buyMaxWorkshopBuyable(this.layer, this.id) },
			unlocked() { return hasUpgrade("m", 21) },
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
		3: {
			requirementDescription: "100 total Machines",
			effectDescription: "Unlock the second row of Machine upgrades.",
			done() { return player.m.total.gte(100) },
		},
	},
	doReset(resettingLayer) {
		if (layers[resettingLayer].row <= this.row) return
		let keep = ["milestones"]
		if (hasMilestone("b", 0)) keep.push("upgrades")
		if (hasMilestone("w", 1)) keep.push("buyables", "spentOnBuyables")
		layerDataReset(this.layer, keep)
	},
	autoUpgrade() {
		return hasUpgrade("w", 12)
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
		if (hasUpgrade("m", 22)) mult = mult.times(buyableEffect("m", 11).pow(0.35))
		if (hasUpgrade("f", 12)) mult = mult.times(upgradeEffect("f", 12))
		if (player.f && player.f.unlocked) mult = mult.times(layers.f.effect())
		if (player.w && player.w.unlocked) mult = mult.times(layers.w.effect())
		if (player.r && player.r.unlocked) mult = mult.times(layers.r.effect())
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
		14: {
			title: "Template Library",
			description: "Blueprints boost Machines gain.",
			cost: new Decimal(15),
			effect() { return player.b.points.add(1).pow(0.45) },
			effectDisplay() { return format(upgradeEffect("b", 14)) + "x" },
			unlocked() { return hasUpgrade("b", 13) },
		},
		15: {
			title: "Factory Survey",
			description: "Factories start 10% cheaper.",
			cost: new Decimal(30),
			unlocked() { return hasUpgrade("b", 14) },
		},
	},
	milestones: {
		0: {
			requirementDescription: "1 total Blueprint",
			effectDescription: "Keep Machine upgrades on Blueprint and higher resets.",
			done() { return player.b.total.gte(1) || hasUpgrade("b", 13) },
		},
		1: {
			requirementDescription: "10 total Blueprints",
			effectDescription: "Unlock bulk buying for Machine buyables.",
			done() { return player.b.total.gte(10) },
		},
		2: {
			requirementDescription: "25 total Blueprints",
			effectDescription: "Keep Blueprint upgrades on Factory resets.",
			done() { return player.b.total.gte(25) },
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
		21: {
			name: "Rush Order",
			challengeDescription: "Parts buyables are weaker.",
			goalDescription: "Reach 2,500 Scraps.",
			canComplete() { return player.points.gte(2500) },
			rewardDescription: "Scrap gain is multiplied by completed contracts.",
			rewardEffect() {
				return new Decimal(1.5).add(challengeCompletions("b", 11)).add(challengeCompletions("b", 12))
			},
			rewardDisplay() { return format(challengeEffect("b", 21)) + "x" },
			completionLimit: 1,
			unlocked() { return hasChallenge("b", 12) },
		},
		22: {
			name: "Tool Audit",
			challengeDescription: "Logistics routing is disabled.",
			goalDescription: "Reach 50 Machines.",
			canComplete() { return player.m.points.gte(50) },
			rewardDescription: "Logistics routes count one extra contract.",
			completionLimit: 1,
			unlocked() { return hasChallenge("b", 21) },
		},
	},
	doReset(resettingLayer) {
		if (layers[resettingLayer].row <= this.row) return
		let keep = ["milestones", "challenges"]
		if (hasMilestone("b", 2) || hasMilestone("w", 1)) keep.push("upgrades")
		layerDataReset(this.layer, keep)
	},
	passiveGeneration() {
		if (hasUpgrade("w", 13)) return 0.1
		return 0
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
	requires() {
		let req = new Decimal(20)
		if (hasUpgrade("b", 15)) req = req.times(0.9)
		return req
	},
	resource: "factories",
	baseResource: "blueprints",
	baseAmount() { return player.b.points },
	type: "static",
	base: 3,
	exponent: 1.45,
	canBuyMax() { return hasMilestone("f", 1) },
	gainMult() {
		let mult = new Decimal(1)
		if (player.w && player.w.unlocked) mult = mult.times(layers.w.effect())
		if (hasUpgrade("r", 12)) mult = mult.times(upgradeEffect("r", 12))
		return mult
	},
	gainExp() { return new Decimal(1) },
	row: 3,
	effect() {
		return new Decimal(2).pow(player.f.points)
	},
	effectDescription() {
		return "multiplying Scrap, Parts, Machines, and Blueprints by " + format(layers.f.effect()) + "x"
	},
	upgrades: {
		11: {
			title: "Shift Office",
			description: "Factories boost Machine gain again.",
			cost: new Decimal(2),
			effect() { return player.f.points.add(1).pow(1.1) },
			effectDisplay() { return format(upgradeEffect("f", 11)) + "x" },
		},
		12: {
			title: "Production Ledger",
			description: "Factories boost Blueprint gain.",
			cost: new Decimal(4),
			effect() { return player.f.points.add(1).pow(0.9) },
			effectDisplay() { return format(upgradeEffect("f", 12)) + "x" },
			unlocked() { return hasUpgrade("f", 11) },
		},
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
		2: {
			requirementDescription: "6 Factories",
			effectDescription: "Unlock Power.",
			done() { return player.f.points.gte(6) },
		},
	},
	doReset(resettingLayer) {
		if (layers[resettingLayer].row <= this.row) return
		let keep = ["milestones"]
		if (hasMilestone("w", 0)) keep.push("upgrades")
		layerDataReset(this.layer, keep)
	},
	passiveGeneration() {
		if (hasUpgrade("r", 14)) return 0.15
		if (hasUpgrade("r", 13)) return 0.05
		return 0
	},
	autoPrestige() {
		return false
	},
	hotkeys: [
		{key: "f", description: "F: reset for Factories", onPress(){ if (canReset(this.layer)) doReset(this.layer) }},
	],
	layerShown() { return player.b.best.gte(8) || player.f.unlocked },
})

addLayer("w", {
	name: "power",
	symbol: "W",
	position: 0,
	startData() { return {
		unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
	}},
	color: "#e0c347",
	requires: new Decimal(6),
	resource: "power cells",
	baseResource: "factories",
	baseAmount() { return player.f.points },
	type: "normal",
	exponent: 0.7,
	gainMult() {
		let mult = new Decimal(1)
		if (hasUpgrade("w", 11)) mult = mult.times(2)
		if (hasUpgrade("w", 14)) mult = mult.times(buyableEffect("w", 11))
		if (player.r && player.r.unlocked) mult = mult.times(layers.r.effect())
		return mult
	},
	gainExp() { return new Decimal(1) },
	row: 4,
	effect() {
		return player.w.points.add(1).pow(0.8)
	},
	effectDescription() {
		return "multiplying core production by " + format(layers.w.effect()) + "x"
	},
	upgrades: {
		11: {
			title: "Dynamos",
			description: "Double Power gain.",
			cost: new Decimal(1),
		},
		12: {
			title: "Motor Control",
			description: "Automatically buy Machine upgrades.",
			cost: new Decimal(2),
			unlocked() { return hasUpgrade("w", 11) },
		},
		13: {
			title: "Drafting Server",
			description: "Passively generate 10% of your Blueprint reset gain each second.",
			cost: new Decimal(4),
			unlocked() { return hasUpgrade("w", 12) },
		},
		14: {
			title: "Battery Racks",
			description: "Unlock Capacitor buyables. They multiply Power gain.",
			cost: new Decimal(8),
			unlocked() { return hasUpgrade("w", 13) },
		},
		15: {
			title: "Power Bus",
			description: "Unlock Robotics.",
			cost: new Decimal(15),
			unlocked() { return hasUpgrade("w", 14) },
		},
	},
	buyables: {
		11: {
			title: "Capacitors",
			cost(x) { return new Decimal(2).times(new Decimal(1.8).pow(x)) },
			effect(x) { return new Decimal(1.5).pow(x) },
			display() { return workshopBuyableDisplay(this.layer, this.id, "Multiplies Power gain.", "power cells") },
			canAfford() { return player.w.points.gte(tmp.w.buyables[this.id].cost) },
			buy() {
				let cost = tmp.w.buyables[this.id].cost
				spendLayerPoints("w", cost)
				addBuyables("w", this.id, 1)
			},
			buyMax() { if (hasMilestone("r", 1)) buyMaxWorkshopBuyable(this.layer, this.id) },
			unlocked() { return hasUpgrade("w", 14) },
		},
	},
	milestones: {
		0: {
			requirementDescription: "1 total Power Cell",
			effectDescription: "Keep Factory upgrades on Power and higher resets.",
			done() { return player.w.total.gte(1) },
		},
		1: {
			requirementDescription: "5 total Power Cells",
			effectDescription: "Keep Blueprint upgrades on Power and higher resets.",
			done() { return player.w.total.gte(5) },
		},
		2: {
			requirementDescription: "15 total Power Cells",
			effectDescription: "Keep Power upgrades on Robotics resets.",
			done() { return player.w.total.gte(15) },
		},
	},
	passiveGeneration() {
		if (hasUpgrade("r", 11)) return 0.1
		return 0
	},
	autoUpgrade() {
		return hasMilestone("r", 0)
	},
	doReset(resettingLayer) {
		if (layers[resettingLayer].row <= this.row) return
		let keep = ["milestones"]
		if (hasMilestone("w", 2)) keep.push("upgrades")
		layerDataReset(this.layer, keep)
	},
	hotkeys: [
		{key: "w", description: "W: reset for Power Cells", onPress(){ if (canReset(this.layer)) doReset(this.layer) }},
	],
	layerShown() { return hasMilestone("f", 2) || player.w.unlocked },
})

addLayer("r", {
	name: "robotics",
	symbol: "R",
	position: 0,
	startData() { return {
		unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
	}},
	color: "#b26ad8",
	requires: new Decimal(20),
	resource: "robotics cores",
	baseResource: "power cells",
	baseAmount() { return player.w.points },
	type: "static",
	base: 2.5,
	exponent: 1.35,
	canBuyMax() { return hasMilestone("r", 2) },
	gainMult() { return new Decimal(1) },
	gainExp() { return new Decimal(1) },
	row: 5,
	effect() {
		return player.r.points.add(1).pow(1.2)
	},
	effectDescription() {
		return "multiplying core production and Power gain by " + format(layers.r.effect()) + "x"
	},
	upgrades: {
		11: {
			title: "Maintenance Bots",
			description: "Passively generate 10% of your Power reset gain each second.",
			cost: new Decimal(1),
		},
		12: {
			title: "Factory Arms",
			description: "Robotics Cores multiply Factory gain.",
			cost: new Decimal(2),
			effect() { return player.r.points.add(1).pow(0.8) },
			effectDisplay() { return format(upgradeEffect("r", 12)) + "x" },
			unlocked() { return hasUpgrade("r", 11) },
		},
		13: {
			title: "Supply Bots",
			description: "Passively generate 5% of your Factory reset gain each second.",
			cost: new Decimal(3),
			unlocked() { return hasUpgrade("r", 12) },
		},
		14: {
			title: "Factory Scheduler",
			description: "Increase passive Factory generation to 15% of your reset gain each second.",
			cost: new Decimal(5),
			unlocked() { return hasUpgrade("r", 13) },
		},
	},
	milestones: {
		0: {
			requirementDescription: "1 Robotics Core",
			effectDescription: "Automatically buy Power upgrades.",
			done() { return player.r.points.gte(1) },
		},
		1: {
			requirementDescription: "2 Robotics Cores",
			effectDescription: "Unlock bulk buying for Power buyables.",
			done() { return player.r.points.gte(2) },
		},
		2: {
			requirementDescription: "4 Robotics Cores",
			effectDescription: "You can buy max Robotics Cores.",
			done() { return player.r.points.gte(4) },
		},
	},
	doReset(resettingLayer) {
		if (layers[resettingLayer].row <= this.row) return
		layerDataReset(this.layer, ["milestones"])
	},
	hotkeys: [
		{key: "r", description: "R: reset for Robotics Cores", onPress(){ if (canReset(this.layer)) doReset(this.layer) }},
	],
	layerShown() { return hasUpgrade("w", 15) || player.r.unlocked },
})
