import { Model } from 'mongoose'
import { ProductInterface } from '../Interfaces/CartInterface'
import ProductModel from '../Models/ProductModel'

interface Product {
	nombre: string
	descripcion: string
	codigo: string
	url: string
	precio: number
	stock: number
}

export default class Products {
	private collection: Model<ProductInterface>
	constructor() {
		this.collection = ProductModel
	}
	save = async (obj: Product): Promise<number> => {
		try {
			const products = await this.getAll()
			const timestamp = Date.now()
			let newID: number
			if (products.length == 0) {
				newID = 1
			} else {
				newID = Number(products[products.length - 1].id) + 1
			}
			const newProduct: ProductInterface = { id: newID, timestamp: timestamp, ...obj }
			const productToAdd = new this.collection(newProduct)
			await productToAdd.save()
			return newID
		} catch (err) {
			console.log(err)
			throw new Error(`Can't save product`)
		}
	}

	getAll = async (): Promise<ProductInterface[]> => {
		try {
			return await this.collection.find()
		} catch (err) {
			console.log(err)
			throw new Error('Error returning all products')
		}
	}

	getById = async (id: number): Promise<ProductInterface | null> => {
		try {
			return await this.collection.findOne({ id: id })
		} catch (err) {
			console.log(err)
			throw new Error('Error getting the product')
		}
	}

	modifyById = async (newValues: ProductInterface, id: number): Promise<boolean> => {
		try {
			const product = await this.getById(id)
			console.log(product)
			if (product != null) {
				if (newValues.nombre) {
					await this.collection
						.findOneAndUpdate(
							{ id: id },
							{
								nombre: newValues.nombre,
							},
							{ new: true }
						)
						.catch((err) => {
							throw err
						})
				}
				if (newValues.descripcion) {
					await this.collection.updateOne(
						{ id: id },
						{
							$set: { descripcion: newValues.descripcion },
						}
					)
				}
				if (newValues.url) {
					await this.collection.updateOne(
						{ id: id },
						{
							$set: { url: newValues.url },
						}
					)
				}
				if (newValues.precio) {
					await this.collection.updateOne(
						{ id: id },
						{
							$set: { precio: newValues.precio },
						}
					)
				}
				return true
			} else {
				return false
			}
		} catch (err) {
			console.log(err)
			throw new Error('Error trying to modify the product')
		}
	}

	deleteById = async (id: number): Promise<boolean> => {
		try {
			const productToDelete = this.getById(id)
			if (productToDelete != null) {
				await this.collection.deleteOne({ id: id })
				return true
			} else {
				return false
			}
		} catch {
			throw new Error('Error deleting the product')
		}
	}

	deleteAll = async (): Promise<void> => {
		try {
			await this.collection.remove()
		} catch {
			throw new Error('Error deleting all products')
		}
	}
}
