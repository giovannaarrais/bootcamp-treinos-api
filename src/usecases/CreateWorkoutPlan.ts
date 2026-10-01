// Data Transfer Object
// determina oq o use case irá receber da controller (q recebe os dados da internet (front))

import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface InputDto {
	userId: string;
	name: string;
	workoutDays: Array<{
		name: string;
		weekDay: WeekDay;
		isRest: boolean;
		estimatedDurationInSeconds: number;
		exercises: Array<{
			order: number;
			name: string;
			sets: number;
			reps: number;
			restTimeInSeconds: number;
		}>;
	}>;
}

export class CreateWorkoutPlan {
	async execute(dto: InputDto) {
		// procura um plano ativo antes de criar um novo
		const existingWorkoutPlan = await prisma.workoutPlan.findFirst({
			where: {
				isActive: true,
			},
		});

		// Transaction - Atomicidiada
		return prisma.$transaction(async (tx) => {
			// se existir, desativa ele
			if (existingWorkoutPlan) {
				await tx.workoutPlan.update({
					where: { id: existingWorkoutPlan.id },
					data: { isActive: false },
				});
			}

			const workoutPlan = await tx.workoutPlan.create({
				data: {
					name: dto.name,
					userId: dto.userId,
					isActive: true,
					workoutDays: {
						create: dto.workoutDays.map((workouDay) => ({
							name: workouDay.name,
							weekDay: workouDay.weekDay,
							isRest: workouDay.isRest,
							estimatedDurationInSeconds:
								workouDay.estimatedDurationInSeconds,
							exercises: {
								create: workouDay.exercises.map((exercise) => ({
									order: exercise.order,
									name: exercise.name,
									sets: exercise.sets,
									reps: exercise.reps,
									restTimeInSeconds:
										exercise.restTimeInSeconds,
								})),
							},
						})),
					},
				},
			});

			const result = await tx.workoutPlan.findUnique({
				where: { id: workoutPlan.id },
				include: {
					workoutDays: {
						include: {
							exercises: true,
						},
					},
				},
			});

			if (!result) {
				throw new NotFoundError("Workout plan not found");
			}

			return result;
		});
	}
}
